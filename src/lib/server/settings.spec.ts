import { beforeEach, describe, expect, it } from 'vitest';
import type { SignerInput } from '#lib/validation/signer.ts';
import {
	detectImageType,
	getCouncilSettings,
	MAX_LOGO_BYTES,
	removeLogo,
	replaceLogo,
	saveCouncilSettings,
	usesSampleData
} from './councilSettings';
import { createDb, type Db } from './db';
import { getSigner, listSigners, saveSigner, setSignerActive } from './signers';
import { createMemoryD1 } from './testing/memoryD1';

const ADMIN = 'admin-1';
const TYPES = [
	'00000000-0000-4000-8000-000000000101',
	'00000000-0000-4000-8000-000000000102',
	'00000000-0000-4000-8000-000000000103'
];
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);

/** In-memory stand-in for the subset of R2 we use. */
function fakeBucket() {
	const objects = new Map<string, { contentType?: string }>();
	return {
		objects,
		put: async (key: string, _value: unknown, options?: R2PutOptions) => {
			const meta = options?.httpMetadata as R2HTTPMetadata | undefined;
			objects.set(key, { contentType: meta?.contentType });
			return null as unknown as R2Object;
		},
		delete: async (keys: string | string[]) => {
			for (const key of [keys].flat()) objects.delete(key);
		}
	};
}

let db: Db;
beforeEach(async () => {
	db = createDb(createMemoryD1({ seed: true }));
	await db.run(
		`INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role)
		 VALUES (?, 'admin', 'Admin', 'x', 'y', 'admin')`,
		ADMIN
	);
});

describe('council settings', () => {
	it('updates the single settings row', async () => {
		await saveCouncilSettings(
			db,
			{
				name: 'Consejo Comunal “9 de Abril”',
				taxId: 'J-40062883-0',
				state: 'Lara',
				municipality: 'Iribarren',
				parish: 'Juan de Villegas',
				sectorAddress: 'Sector 9 de Abril',
				city: 'Barquisimeto',
				validityMonths: 3,
				validityNote: null
			},
			ADMIN
		);
		const rows = await db.all('SELECT * FROM council_settings');
		expect(rows).toHaveLength(1);
		expect(await getCouncilSettings(db)).toMatchObject({
			name: 'Consejo Comunal “9 de Abril”',
			tax_id: 'J-40062883-0',
			validity_months: 3,
			validity_note: null
		});
		expect((await usesSampleData(db)).council).toBe(false);
	});

	it('detects JPEG and PNG by content, not by name', () => {
		expect(detectImageType(JPEG)).toBe('jpeg');
		expect(detectImageType(PNG)).toBe('png');
		expect(detectImageType(new TextEncoder().encode('<svg>'))).toBeNull();
	});

	it('replaces the logo and deletes the previous object', async () => {
		const bucket = fakeBucket();
		const first = await replaceLogo(db, bucket, new File([JPEG], 'logo.jpg'), ADMIN);
		expect(first).toMatchObject({ ok: true });
		const firstKey = first.ok ? first.key : '';
		expect(firstKey).toMatch(/^public\/council-logo-[0-9a-f]{8}\.jpg$/);
		expect(bucket.objects.get(firstKey)?.contentType).toBe('image/jpeg');

		const second = await replaceLogo(db, bucket, new File([PNG], 'otro.jpg'), ADMIN);
		const secondKey = second.ok ? second.key : '';
		expect(secondKey).toMatch(/\.png$/);
		expect([...bucket.objects.keys()]).toEqual([secondKey]);
		expect((await getCouncilSettings(db))?.logo_r2_key).toBe(secondKey);

		await removeLogo(db, bucket, ADMIN);
		expect(bucket.objects.size).toBe(0);
		expect((await getCouncilSettings(db))?.logo_r2_key).toBeNull();
	});

	it('rejects missing, oversized and non-image logos', async () => {
		const bucket = fakeBucket();
		expect(await replaceLogo(db, bucket, null, ADMIN)).toEqual({
			ok: false,
			reason: 'logo_missing'
		});
		const big = new File([JPEG, new Uint8Array(MAX_LOGO_BYTES)], 'big.jpg');
		expect(await replaceLogo(db, bucket, big, ADMIN)).toEqual({
			ok: false,
			reason: 'logo_too_large'
		});
		const svg = new File(['<svg></svg>'], 'logo.png', { type: 'image/png' });
		expect(await replaceLogo(db, bucket, svg, ADMIN)).toEqual({
			ok: false,
			reason: 'logo_invalid_type'
		});
		expect(bucket.objects.size).toBe(0);
	});
});

describe('signers', () => {
	const input: SignerInput = {
		fullName: 'Ana María Rodríguez',
		shortName: 'Ana Rodríguez',
		nationalId: 'V-12345678',
		roleTitle: 'Voc. Finanzas',
		phone: '0412-1234567',
		gender: 'F',
		displayOrder: 1,
		certificateTypeIds: [TYPES[0], TYPES[2], 'not-a-type']
	};

	it('creates a signer with its default certificate types', async () => {
		const result = await saveSigner(db, input, ADMIN);
		expect(result.ok).toBe(true);
		const signer = await getSigner(db, result.ok ? result.id : '');
		expect(signer).toMatchObject({ full_name: 'Ana María Rodríguez', is_active: 1 });
		expect(signer?.certificate_type_ids.sort()).toEqual([TYPES[0], TYPES[2]].sort());
	});

	it('updates a signer and replaces its default types', async () => {
		const created = await saveSigner(db, input, ADMIN);
		const id = created.ok ? created.id : '';
		await saveSigner(
			db,
			{ ...input, roleTitle: 'Voc. Contraloría', certificateTypeIds: [TYPES[1]] },
			ADMIN,
			id
		);
		expect(await getSigner(db, id)).toMatchObject({
			role_title: 'Voc. Contraloría',
			certificate_type_ids: [TYPES[1]]
		});
		expect(await saveSigner(db, input, ADMIN, 'missing')).toEqual({
			ok: false,
			reason: 'not_found'
		});
	});

	it('deactivates and reactivates signers, active first in the list', async () => {
		const seeded = '00000000-0000-4000-8000-000000000201';
		expect(await setSignerActive(db, seeded, false, ADMIN)).toBe(true);
		const list = await listSigners(db);
		expect(list.at(-1)?.id).toBe(seeded);
		expect(list.at(-1)?.is_active).toBe(0);
		expect(await setSignerActive(db, seeded, true, ADMIN)).toBe(true);
		expect(await setSignerActive(db, 'missing', true, ADMIN)).toBe(false);
	});

	it('stops flagging sample signers once they are all deactivated', async () => {
		expect((await usesSampleData(db)).signers).toBe(true);
		for (const signer of await listSigners(db)) {
			await setSignerActive(db, signer.id, false, ADMIN);
		}
		expect((await usesSampleData(db)).signers).toBe(false);
	});
});
