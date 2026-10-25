import { describe, expect, it } from 'vitest';
import { normalizeNationalId, validateCertificateRequest } from './certificateRequest';

const validFields = {
	certificate_type_id: 'type-1',
	national_id: 'v-12.345.678',
	first_names: '  María   José ',
	last_names: "Pérez D'Ávila",
	gender: 'F',
	marital_status: 'single',
	occupation: '',
	street_address: 'Calle 5, sector El Carmen',
	house_number: '',
	phone: '+58 412 123 45 67',
	known_since_text: 'más de 20 años'
};

function formOf(fields: Record<string, string>): FormData {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) form.set(key, value);
	return form;
}

describe('normalizeNationalId', () => {
	it.each([
		['V-12345678', 'V-12345678'],
		['v12.345.678', 'V-12345678'],
		['E 81234567', 'E-81234567'],
		['12345678', 'V-12345678'],
		[' 1.234.567 ', 'V-1234567']
	])('%j → %s', (input, expected) => {
		expect(normalizeNationalId(input)).toBe(expected);
	});

	it.each(['', 'X-12345678', 'V-12', 'V-1234567890', 'V-12a45678'])('rejects %j', (input) => {
		expect(normalizeNationalId(input)).toBeNull();
	});
});

describe('validateCertificateRequest', () => {
	it('returns normalized data for a valid form', () => {
		const result = validateCertificateRequest(formOf(validFields));
		expect(result).toEqual({
			ok: true,
			data: {
				certificateTypeId: 'type-1',
				nationalId: 'V-12345678',
				firstNames: 'María José',
				lastNames: "Pérez D'Ávila",
				gender: 'F',
				maritalStatus: 'single',
				occupation: null,
				streetAddress: 'Calle 5, sector El Carmen',
				houseNumber: null,
				phone: '0412-1234567',
				knownSinceText: 'más de 20 años'
			}
		});
	});

	it('reports required fields and keeps the submitted values', () => {
		const result = validateCertificateRequest(formOf({ first_names: 'Ana' }));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors).toMatchObject({
			certificate_type_id: 'required',
			national_id: 'required',
			last_names: 'required',
			phone: 'required',
			known_since_text: 'required'
		});
		expect(result.errors.first_names).toBeUndefined();
		expect(result.errors.occupation).toBeUndefined();
		expect(result.values.first_names).toBe('Ana');
	});

	it('rejects malformed values', () => {
		const result = validateCertificateRequest(
			formOf({
				...validFields,
				national_id: 'ABC',
				first_names: 'Ana123',
				gender: 'X',
				marital_status: 'soltera',
				phone: '0512-1234567'
			})
		);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors).toEqual({
			national_id: 'invalid_national_id',
			first_names: 'invalid_name',
			gender: 'invalid_option',
			marital_status: 'invalid_option',
			phone: 'invalid_phone'
		});
	});

	it('enforces maximum lengths', () => {
		const result = validateCertificateRequest(
			formOf({ ...validFields, street_address: 'a'.repeat(161) })
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.errors.street_address).toBe('too_long');
	});
});
