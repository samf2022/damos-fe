import { describe, expect, it } from 'vitest';
import { normalizeNationalId, validateResident } from './resident';

const VALID = {
	national_id: 'v-12.345.678',
	first_names: 'María  José',
	last_names: 'Pérez',
	gender: 'F',
	marital_status: 'single',
	occupation: '',
	street_address: 'calle Los Pinos',
	house_number: '',
	phone: ''
};

function form(fields: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.append(key, value);
	return data;
}

describe('normalizeNationalId', () => {
	it('accepts the usual ways of writing a cédula', () => {
		expect(normalizeNationalId('12345678')).toBe('V-12345678');
		expect(normalizeNationalId('E 81.234.567')).toBe('E-81234567');
		expect(normalizeNationalId('X-123')).toBeNull();
	});
});

describe('validateResident', () => {
	it('normalizes the data; the phone is optional for admins', () => {
		expect(validateResident(form(VALID))).toEqual({
			ok: true,
			data: {
				nationalId: 'V-12345678',
				firstNames: 'María José',
				lastNames: 'Pérez',
				gender: 'F',
				maritalStatus: 'single',
				occupation: null,
				streetAddress: 'calle Los Pinos',
				houseNumber: null,
				phone: null
			}
		});
	});

	it('formats a phone when given', () => {
		const result = validateResident(form({ ...VALID, phone: '04121234567' }));
		expect(result.ok && result.data.phone).toBe('0412-1234567');
	});

	it('reports invalid values', () => {
		const result = validateResident(
			form({ ...VALID, national_id: 'abc', gender: 'X', marital_status: 'otro', phone: '123' })
		);
		expect(result).toMatchObject({
			ok: false,
			errors: {
				national_id: 'invalid_national_id',
				gender: 'invalid_option',
				marital_status: 'invalid_option',
				phone: 'invalid_phone'
			}
		});
	});
});
