import { beforeEach, describe, expect, it } from 'vitest';
import type { ResidentSnapshot } from '#lib/types.ts';
import type { ResidentInput } from '#lib/validation/resident.ts';
import { createDb, type Db } from './db';
import { getResidentDetail, listResidents, RESIDENTS_PAGE_SIZE, saveResident } from './residents';
import { insertAdminUser } from './testing/fixtures';
import { createMemoryD1 } from './testing/memoryD1';

const RESIDENCE = '00000000-0000-4000-8000-000000000101';
const CONDUCT = '00000000-0000-4000-8000-000000000103';

const CORRECTED: ResidentInput = {
	nationalId: 'V-12345678',
	firstNames: 'Ana Luisa',
	lastNames: 'Prueba Demo',
	gender: 'F',
	maritalStatus: 'married',
	occupation: 'docente',
	streetAddress: 'calle El Porvenir',
	houseNumber: '48',
	phone: '0412-1234567'
};

let db: Db;
let adminId: string;

async function insertResident(id: string, nationalId: string, first: string, last: string) {
	await db.run(
		`INSERT INTO residents (id, national_id, first_names, last_names, gender, street_address)
		 VALUES (?, ?, ?, ?, 'F', 'CALLE EL PORVENIR')`,
		id,
		nationalId,
		first,
		last
	);
}

beforeEach(async () => {
	db = createDb(createMemoryD1({ seed: true }));
	adminId = await insertAdminUser(db, { username: 'admin', password: 'clave-de-prueba-123' });
	await insertResident('r1', 'V-12345678', 'Ana', 'Prueba');
	await insertResident('r2', 'V-87654321', 'Beatriz', 'Ejemplo');
	await db.run(
		`INSERT INTO certificates (id, resident_id, certificate_type_id, status, resident_snapshot,
		                           submitted_at, serial_number, expires_at)
		 VALUES ('p1', 'r1', ?, 'pending', '{"firstNames":"Ana"}', '2026-10-01T10:00:00.000Z', NULL, NULL),
		        ('a1', 'r1', ?, 'approved', '{"firstNames":"Ana"}', '2026-09-01T10:00:00.000Z',
		         '2026-0001', '2027-03-01T10:00:00.000Z')`,
		RESIDENCE,
		CONDUCT
	);
});

describe('listResidents', () => {
	it('lists residents by surname with their request counts', async () => {
		const { residents, total } = await listResidents(db, { q: '', page: 1 });
		expect(total).toBe(2);
		expect(residents.map((r) => [r.last_names, r.certificate_count, r.last_submitted_at])).toEqual([
			['Ejemplo', 0, null],
			['Prueba', 2, '2026-10-01T10:00:00.000Z']
		]);
	});

	it('searches by cédula in any format or by part of the name', async () => {
		expect((await listResidents(db, { q: '12.345.678', page: 1 })).residents[0].id).toBe('r1');
		expect((await listResidents(db, { q: 'beat', page: 1 })).residents.map((r) => r.id)).toEqual([
			'r2'
		]);
		expect((await listResidents(db, { q: '%', page: 1 })).total).toBe(2);
	});

	it('paginates', async () => {
		for (let i = 0; i < RESIDENTS_PAGE_SIZE; i++) {
			await insertResident(`x${i}`, `V-${1000000 + i}`, 'Persona', `Zeta ${i}`);
		}
		const page2 = await listResidents(db, { q: '', page: 2 });
		expect(page2.total).toBe(RESIDENTS_PAGE_SIZE + 2);
		expect(page2.residents).toHaveLength(2);
	});
});

describe('getResidentDetail', () => {
	it('returns the record and its certificates, newest first', async () => {
		const detail = await getResidentDetail(db, 'r1');
		expect(detail?.resident.first_names).toBe('Ana');
		expect(detail?.certificates.map((c) => [c.id, c.type_title])).toEqual([
			['p1', 'Constancia de Residencia'],
			['a1', 'Constancia de Buena Conducta']
		]);
		expect(await getResidentDetail(db, 'nope')).toBeNull();
	});
});

describe('saveResident', () => {
	const snapshotOf = async (id: string) =>
		JSON.parse(
			(await db.first<{ resident_snapshot: string }>(
				'SELECT resident_snapshot FROM certificates WHERE id = ?',
				id
			))!.resident_snapshot
		) as ResidentSnapshot;

	it('corrects the record and audits the previous values, leaving requests alone', async () => {
		expect(await saveResident(db, 'r1', CORRECTED, adminId, { applyToPending: false })).toEqual({
			ok: true,
			updatedPending: 0
		});
		const detail = await getResidentDetail(db, 'r1');
		expect(detail?.resident).toMatchObject({
			first_names: 'Ana Luisa',
			street_address: 'calle El Porvenir',
			marital_status: 'married'
		});
		expect((await snapshotOf('p1')).firstNames).toBe('Ana');
		const log = await db.first<{ metadata: string }>(
			"SELECT metadata FROM audit_logs WHERE action = 'resident.updated'"
		);
		expect(JSON.parse(log!.metadata)).toMatchObject({
			previous: { firstNames: 'Ana', streetAddress: 'CALLE EL PORVENIR' },
			updatedPending: []
		});
	});

	it('can apply the correction to pending requests, never to issued ones', async () => {
		const result = await saveResident(db, 'r1', CORRECTED, adminId, { applyToPending: true });
		expect(result).toEqual({ ok: true, updatedPending: 1 });
		expect(await snapshotOf('p1')).toEqual(CORRECTED);
		expect((await snapshotOf('a1')).firstNames).toBe('Ana');
	});

	it('refuses a cédula that belongs to someone else', async () => {
		const result = await saveResident(
			db,
			'r1',
			{ ...CORRECTED, nationalId: 'V-87654321' },
			adminId,
			{ applyToPending: false }
		);
		expect(result).toEqual({ ok: false, reason: 'duplicate_national_id' });
		expect(await saveResident(db, 'nope', CORRECTED, adminId, { applyToPending: false })).toEqual({
			ok: false,
			reason: 'not_found'
		});
	});
});
