import { describe, expect, it } from 'vitest';
import { normalizeTaxId, validateCouncilSettings } from './councilSettings';
import { validateSigner } from './signer';

function formOf(fields: Record<string, string | string[]>): FormData {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		for (const item of [value].flat()) form.append(key, item);
	}
	return form;
}

const council = {
	name: 'Consejo Comunal “9 de Abril”',
	tax_id: 'j-40062883-0',
	state: 'Lara',
	municipality: 'Iribarren',
	parish: 'Juan de Villegas',
	sector_address: 'Sector 9 de Abril',
	city: 'Barquisimeto',
	validity_months: '6',
	validity_note: '  Válida por seis meses.\r\n  Sin enmiendas.  '
};

describe('normalizeTaxId', () => {
	it.each([
		['j-40062883-0', 'J-40062883-0'],
		['J400628830', 'J-40062883-0'],
		['G 20000001 5', 'G-20000001-5']
	])('%j → %s', (input, expected) => {
		expect(normalizeTaxId(input)).toBe(expected);
	});

	it.each(['', 'X-40062883-0', 'J-4006288-0', 'J-40062883'])('rejects %j', (input) => {
		expect(normalizeTaxId(input)).toBeNull();
	});
});

describe('validateCouncilSettings', () => {
	it('normalizes valid settings', () => {
		const result = validateCouncilSettings(formOf(council));
		expect(result).toEqual({
			ok: true,
			data: {
				name: 'Consejo Comunal “9 de Abril”',
				taxId: 'J-40062883-0',
				state: 'Lara',
				municipality: 'Iribarren',
				parish: 'Juan de Villegas',
				sectorAddress: 'Sector 9 de Abril',
				city: 'Barquisimeto',
				validityMonths: 6,
				validityNote: 'Válida por seis meses.\nSin enmiendas.'
			}
		});
	});

	it('allows an empty RIF and note', () => {
		const result = validateCouncilSettings(formOf({ ...council, tax_id: '', validity_note: '' }));
		expect(result.ok && result.data).toMatchObject({ taxId: null, validityNote: null });
	});

	it('reports invalid values', () => {
		const result = validateCouncilSettings(
			formOf({ ...council, name: '', tax_id: 'abc', validity_months: '0' })
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors).toEqual({
				name: 'required',
				tax_id: 'invalid_tax_id',
				validity_months: 'invalid_number'
			});
		}
	});
});

describe('validateSigner', () => {
	const signer = {
		full_name: 'Ana  María Rodríguez',
		short_name: 'Ana Rodríguez',
		national_id: 'v12.345.678',
		role_title: 'Voc. Finanzas',
		phone: '+58 412 123 4567',
		gender: 'F',
		display_order: '2',
		certificate_type_ids: ['t1', 't2', 't1']
	};

	it('normalizes a valid signer', () => {
		expect(validateSigner(formOf(signer))).toEqual({
			ok: true,
			data: {
				fullName: 'Ana María Rodríguez',
				shortName: 'Ana Rodríguez',
				nationalId: 'V-12345678',
				roleTitle: 'Voc. Finanzas',
				phone: '0412-1234567',
				gender: 'F',
				displayOrder: 2,
				certificateTypeIds: ['t1', 't2']
			}
		});
	});

	it('allows no phone, no order and no default types', () => {
		const result = validateSigner(
			formOf({ ...signer, phone: '', display_order: '', certificate_type_ids: [] })
		);
		expect(result.ok && result.data).toMatchObject({
			phone: null,
			displayOrder: 0,
			certificateTypeIds: []
		});
	});

	it('reports invalid values and keeps the selected types', () => {
		const result = validateSigner(
			formOf({ ...signer, national_id: 'x', phone: '123', gender: '', display_order: '-1' })
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors).toEqual({
				national_id: 'invalid_national_id',
				phone: 'invalid_phone',
				gender: 'required',
				display_order: 'invalid_number'
			});
			expect(result.values.certificate_type_ids).toEqual(['t1', 't2', 't1']);
		}
	});
});
