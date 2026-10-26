// Starts a dev server for the e2e tests on a fresh, isolated local database:
// migrations + seed, fictitious admin users (e2e/config.ts), then `vite dev` with E2E=1
// (see vite.config.ts: separate persistence dir and e2e/e2e.env instead of .dev.vars).
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashPassword } from '../src/lib/server/password.ts';
import { E2E_PASSWORD, E2E_PORT, E2E_ROLES, E2E_STATE_DIR, E2E_USERS } from './config.ts';

const DATABASE_NAME = 'damos-fe-db';

function wrangler(...args: string[]) {
	const result = spawnSync('pnpm', ['exec', 'wrangler', ...args], { stdio: 'inherit' });
	if (result.status !== 0) throw new Error(`wrangler ${args.join(' ')} failed`);
}

rmSync(E2E_STATE_DIR, { recursive: true, force: true });
wrangler('d1', 'migrations', 'apply', DATABASE_NAME, '--local', '--persist-to', E2E_STATE_DIR);

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;
const rows = await Promise.all(
	Object.entries(E2E_USERS).map(async ([key, username]) => {
		const { hash, salt } = await hashPassword(E2E_PASSWORD);
		const role = E2E_ROLES[key as keyof typeof E2E_USERS];
		return `(${[randomUUID(), username, username, hash, salt, role].map(sqlString).join(', ')})`;
	})
);
const dir = mkdtempSync(join(tmpdir(), 'damos-fe-e2e-'));
const file = join(dir, 'users.sql');
writeFileSync(
	file,
	`INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role) VALUES ${rows.join(', ')};`
);
try {
	wrangler(
		'd1',
		'execute',
		DATABASE_NAME,
		'--local',
		'--persist-to',
		E2E_STATE_DIR,
		`--file=${file}`
	);
} finally {
	rmSync(dir, { recursive: true, force: true });
}

const server = spawn('pnpm', ['exec', 'vite', 'dev', '--port', String(E2E_PORT), '--strictPort'], {
	stdio: 'inherit',
	env: { ...process.env, E2E: '1' }
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => server.kill(signal));
}
server.on('exit', (code) => process.exit(code ?? 0));
