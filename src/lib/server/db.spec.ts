import { describe, expect, it } from 'vitest';
import { createDb, fromDbBoolean, getDb, newId, toDbBoolean, type SignerRow } from './db';
import { createMemoryD1 } from './testing/memoryD1';

describe('createDb', () => {
	it('reads seeded rows with first and all', async () => {
		const db = createDb(createMemoryD1({ seed: true }));

		const signers = await db.all<SignerRow>('SELECT * FROM signers ORDER BY display_order');
		expect(signers).toHaveLength(3);
		expect(signers[0].role_title).toBe('Voc. Finanzas');

		const missing = await db.first<SignerRow>('SELECT * FROM signers WHERE id = ?', 'nope');
		expect(missing).toBeNull();
	});

	it('returns changed row count from run', async () => {
		const db = createDb(createMemoryD1({ seed: true }));
		const changes = await db.run('UPDATE signers SET is_active = ? WHERE gender = ?', 0, 'F');
		expect(changes).toBe(2);
	});

	it('runs batches atomically', async () => {
		const db = createDb(createMemoryD1());
		const insert = (id: string, nationalId: string) =>
			db.prepare(
				`INSERT INTO residents (id, national_id, first_names, last_names, gender, street_address)
				 VALUES (?, ?, 'A', 'B', 'F', 'Calle 1')`,
				id,
				nationalId
			);

		await expect(db.batch([insert(newId(), 'V-1'), insert(newId(), 'V-1')])).rejects.toThrow();
		const count = await db.first<{ n: number }>('SELECT count(*) AS n FROM residents');
		expect(count?.n).toBe(0);
	});
});

describe('getDb', () => {
	it('throws a 500 when the binding is missing', () => {
		expect(() => getDb(undefined)).toThrow();
	});
});

describe('helpers', () => {
	it('generates UUIDs and converts booleans', () => {
		expect(newId()).toMatch(/^[0-9a-f-]{36}$/);
		expect(toDbBoolean(true)).toBe(1);
		expect(fromDbBoolean(0)).toBe(false);
	});
});
