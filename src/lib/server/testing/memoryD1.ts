// Test-only D1 stand-in backed by node:sqlite, with the real migrations applied.
// Implements just the subset of the D1 API that `createDb` uses.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

const migrationsDir = join(import.meta.dirname, '../../../../migrations');

class MemoryStatement {
	constructor(
		private db: DatabaseSync,
		private sql: string,
		private params: SQLInputValue[] = []
	) {}

	bind(...params: SQLInputValue[]) {
		return new MemoryStatement(this.db, this.sql, params);
	}

	async first<T>() {
		return (this.db.prepare(this.sql).get(...this.params) ?? null) as T | null;
	}

	async all<T>() {
		return { results: this.db.prepare(this.sql).all(...this.params) as T[], success: true };
	}

	async run() {
		const result = this.db.prepare(this.sql).run(...this.params);
		return { success: true, meta: { changes: Number(result.changes) } };
	}

	execSync() {
		return this.db.prepare(this.sql).run(...this.params);
	}
}

export function createMemoryD1(options: { seed?: boolean } = {}): D1Database {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON;');
	const files = readdirSync(migrationsDir)
		.filter((file) => file.endsWith('.sql'))
		.filter((file) => options.seed || !file.includes('seed'))
		.sort();
	for (const file of files) db.exec(readFileSync(join(migrationsDir, file), 'utf8'));

	const d1 = {
		prepare: (sql: string) => new MemoryStatement(db, sql),
		batch: async (statements: MemoryStatement[]) => {
			db.exec('BEGIN');
			try {
				for (const statement of statements) statement.execSync();
				db.exec('COMMIT');
			} catch (err) {
				db.exec('ROLLBACK');
				throw err;
			}
			return [];
		}
	};
	return d1 as unknown as D1Database;
}
