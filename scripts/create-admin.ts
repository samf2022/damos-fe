// Creates (or resets the password of) an admin user in D1.
//
//   pnpm create-admin --username admin --name "Administrador" [--role admin|reviewer] [--remote]
//
// The password is read from a hidden prompt, or from ADMIN_PASSWORD for non-interactive use.
// It runs `wrangler d1 execute` with a temporary SQL file, so the hash is computed locally
// and the plain password never leaves this machine.
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { hashPassword } from '../src/lib/server/password.ts';

const DATABASE_NAME = 'damos-fe-db';
const MIN_PASSWORD_LENGTH = 10;

function fail(message: string): never {
	console.error(`✖ ${message}`);
	process.exit(1);
}

function promptHidden(question: string): Promise<string> {
	return new Promise((resolve) => {
		const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
		const output = rl as unknown as { _writeToOutput: (text: string) => void };
		let muted = false;
		output._writeToOutput = (text: string) => {
			if (!muted || text.includes('\n')) process.stdout.write(muted ? '\n' : text);
		};
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		});
		muted = true;
	});
}

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

const { values } = parseArgs({
	options: {
		username: { type: 'string', short: 'u' },
		name: { type: 'string', short: 'n' },
		role: { type: 'string', default: 'admin' },
		remote: { type: 'boolean', default: false },
		help: { type: 'boolean', short: 'h', default: false }
	}
});

if (values.help || !values.username) {
	console.log(
		'Uso: pnpm create-admin --username <usuario> [--name "Nombre visible"] [--role admin|reviewer] [--remote]'
	);
	process.exit(values.help ? 0 : 1);
}

const username = values.username.trim();
const displayName = (values.name ?? username).trim();
const role = values.role;
if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
	fail('El usuario debe tener 3–32 caracteres: letras, números, ".", "_" o "-".');
}
if (role !== 'admin' && role !== 'reviewer') fail('El rol debe ser "admin" o "reviewer".');

let password = process.env.ADMIN_PASSWORD;
if (!password) {
	if (!process.stdin.isTTY) fail('Define ADMIN_PASSWORD o ejecuta el comando en una terminal.');
	password = await promptHidden('Contraseña: ');
	const confirmation = await promptHidden('Repite la contraseña: ');
	if (password !== confirmation) fail('Las contraseñas no coinciden.');
}
if (password.length < MIN_PASSWORD_LENGTH) {
	fail(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
}

const { hash, salt } = await hashPassword(password);
const now = new Date().toISOString();
// Re-running for an existing username resets its password and reactivates it.
const sql = `INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role, is_active, created_at, updated_at)
VALUES (${[randomUUID(), username, displayName, hash, salt, role].map(sqlString).join(', ')}, 1, ${sqlString(now)}, ${sqlString(now)})
ON CONFLICT (username) DO UPDATE SET
	display_name = excluded.display_name,
	password_hash = excluded.password_hash,
	password_salt = excluded.password_salt,
	role = excluded.role,
	is_active = 1,
	updated_at = excluded.updated_at;
DELETE FROM sessions WHERE admin_user_id = (SELECT id FROM admin_users WHERE username = ${sqlString(username)});
INSERT INTO audit_logs (id, admin_user_id, action, entity, entity_id, metadata, created_at)
SELECT ${sqlString(randomUUID())}, NULL, 'admin_user.upsert_cli', 'admin_users', id, json_object('username', username), ${sqlString(now)}
FROM admin_users WHERE username = ${sqlString(username)};
`;

const dir = mkdtempSync(join(tmpdir(), 'damos-fe-'));
const file = join(dir, 'create-admin.sql');
writeFileSync(file, sql, { mode: 0o600 });

const target = values.remote ? '--remote' : '--local';
console.log(`→ Creando usuario "${username}" (${role}) en ${DATABASE_NAME} ${target}…`);
const result = spawnSync(
	'pnpm',
	['exec', 'wrangler', 'd1', 'execute', DATABASE_NAME, target, `--file=${file}`, '--yes'],
	{ stdio: 'inherit' }
);
rmSync(dir, { recursive: true, force: true });

if (result.status !== 0) fail('wrangler d1 execute falló. Revisa el mensaje anterior.');
console.log(`✔ Usuario "${username}" listo. Inicia sesión en /admin/login.`);
