import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type CertificateTypeRow, type Db } from './db';
import {
	getCertificateTypeEditor,
	listCertificateTypesForAdmin,
	saveCertificateType
} from './certificateTypes';
import { insertAdminUser } from './testing/fixtures';
import { createMemoryD1 } from './testing/memoryD1';

const RESIDENCE = '00000000-0000-4000-8000-000000000101';
const CONDUCT = '00000000-0000-4000-8000-000000000103';
const INPUT = {
	title: 'Constancia de Residencia (nueva)',
	bodyTemplate: 'Texto nuevo para {{resident.fullName}}.',
	isActive: true
};

let db: Db;
let adminId: string;
beforeEach(async () => {
	db = createDb(createMemoryD1({ seed: true }));
	adminId = await insertAdminUser(db, { username: 'admin', password: 'clave-de-prueba-123' });
	await db.run(
		`INSERT INTO residents (id, national_id, first_names, last_names, gender, street_address)
		 VALUES ('r1', 'V-1', 'Ana', 'Prueba', 'F', 'calle 1')`
	);
	await db.run(
		`INSERT INTO certificates (id, resident_id, certificate_type_id, status, resident_snapshot)
		 VALUES ('c1', 'r1', ?, 'pending', '{}'), ('c2', 'r1', ?, 'rejected', '{}')`,
		RESIDENCE,
		RESIDENCE
	);
});

describe('listCertificateTypesForAdmin', () => {
	it('lists every type with its pending requests', async () => {
		const types = await listCertificateTypesForAdmin(db);
		expect(types).toHaveLength(3);
		expect(types.find((type) => type.id === RESIDENCE)?.pending_count).toBe(1);
		expect(types.find((type) => type.id === CONDUCT)?.pending_count).toBe(0);
	});
});

describe('getCertificateTypeEditor', () => {
	it('loads the type, council and active signers with the defaults first', async () => {
		const editor = await getCertificateTypeEditor(db, RESIDENCE);
		expect(editor?.type.code).toBe('residence');
		expect(editor?.council).not.toBeNull();
		expect(editor?.pendingCount).toBe(1);
		expect(editor?.previewSigners.length).toBeGreaterThanOrEqual(2);
		expect(editor?.previewSigners[0]).toEqual(
			expect.objectContaining({ fullName: expect.any(String), shortName: expect.any(String) })
		);
	});

	it('skips inactive signers', async () => {
		await db.run('UPDATE signers SET is_active = 0');
		expect((await getCertificateTypeEditor(db, RESIDENCE))?.previewSigners).toEqual([]);
	});

	it('returns null for an unknown id', async () => {
		expect(await getCertificateTypeEditor(db, 'nope')).toBeNull();
	});
});

describe('saveCertificateType', () => {
	it('updates the type and audits the previous version', async () => {
		const before = await db.first<CertificateTypeRow>(
			'SELECT * FROM certificate_types WHERE id = ?',
			RESIDENCE
		);
		expect(await saveCertificateType(db, RESIDENCE, INPUT, adminId)).toEqual({ ok: true });

		const after = await db.first<CertificateTypeRow>(
			'SELECT * FROM certificate_types WHERE id = ?',
			RESIDENCE
		);
		expect(after).toMatchObject({ title: INPUT.title, body_template: INPUT.bodyTemplate });
		const log = await db.first<{ admin_user_id: string; metadata: string }>(
			"SELECT admin_user_id, metadata FROM audit_logs WHERE action = 'certificate_type.updated'"
		);
		expect(log?.admin_user_id).toBe(adminId);
		expect(JSON.parse(log!.metadata)).toEqual({
			previous: { title: before!.title, body_template: before!.body_template, is_active: 1 }
		});
	});

	it('can deactivate a type while another stays available', async () => {
		await saveCertificateType(db, CONDUCT, { ...INPUT, isActive: false }, adminId);
		const row = await db.first<{ is_active: number }>(
			'SELECT is_active FROM certificate_types WHERE id = ?',
			CONDUCT
		);
		expect(row?.is_active).toBe(0);
	});

	it('refuses to deactivate the last available type', async () => {
		await db.run('UPDATE certificate_types SET is_active = 0 WHERE id <> ?', RESIDENCE);
		expect(
			await saveCertificateType(db, RESIDENCE, { ...INPUT, isActive: false }, adminId)
		).toEqual({ ok: false, reason: 'last_active' });
		// Editing its text while keeping it available is fine.
		expect((await saveCertificateType(db, RESIDENCE, INPUT, adminId)).ok).toBe(true);
	});

	it('reports an unknown id', async () => {
		expect(await saveCertificateType(db, 'nope', INPUT, adminId)).toEqual({
			ok: false,
			reason: 'not_found'
		});
	});
});
