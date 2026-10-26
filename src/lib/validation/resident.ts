// Rules for a resident's personal data, shared by the public request form and the admin
// residents page so both normalize the same way.
import { isMaritalStatus, type MaritalStatus } from '#lib/text/genderAgreement.ts';
import type { Gender, ResidentSnapshot } from '#lib/types.ts';
import { formatVenezuelanPhone } from '#lib/whatsapp.ts';
import { checkPresence, NAME_PATTERN, readValues, type FormErrors } from './form.ts';

export const RESIDENT_FIELDS = [
	'national_id',
	'first_names',
	'last_names',
	'gender',
	'marital_status',
	'occupation',
	'street_address',
	'house_number',
	'phone'
] as const;

export type ResidentField = (typeof RESIDENT_FIELDS)[number];
export type ResidentValues = Record<ResidentField, string>;

export type ResidentInput = ResidentSnapshot & { maritalStatus: MaritalStatus };

export const RESIDENT_MAX_LENGTH: Record<ResidentField, number> = {
	national_id: 20,
	first_names: 80,
	last_names: 80,
	gender: 1,
	marital_status: 20,
	occupation: 80,
	street_address: 160,
	house_number: 40,
	phone: 20
};

/**
 * Normalizes a Venezuelan cédula to `V-12345678` / `E-12345678`.
 * Accepts `V12345678`, `v-12.345.678`, `E 81234567` and bare digits (defaults to `V`).
 */
export function normalizeNationalId(value: string): string | null {
	const match = /^([VE])?[\s-]*([\d.\s]+)$/i.exec(value.trim());
	if (!match) return null;
	const digits = match[2].replace(/[.\s]/g, '');
	if (!/^\d{5,9}$/.test(digits)) return null;
	return `${(match[1] ?? 'V').toUpperCase()}-${Number(digits)}`;
}

/**
 * Checks the resident fields of `values` (which may hold other fields too), adding to `errors`.
 * Returns the normalized data when those fields are valid.
 */
export function checkResidentValues(
	values: ResidentValues,
	errors: FormErrors<ResidentField>,
	options: { phoneRequired: boolean }
): ResidentInput | null {
	const nationalId = normalizeNationalId(values.national_id);
	if (!errors.national_id && !nationalId) errors.national_id = 'invalid_national_id';

	for (const field of ['first_names', 'last_names'] as const) {
		if (!errors[field] && !NAME_PATTERN.test(values[field])) errors[field] = 'invalid_name';
	}
	if (!errors.gender && values.gender !== 'F' && values.gender !== 'M') {
		errors.gender = 'invalid_option';
	}
	if (!errors.marital_status && !isMaritalStatus(values.marital_status)) {
		errors.marital_status = 'invalid_option';
	}
	const phone = values.phone ? formatVenezuelanPhone(values.phone) : null;
	if (!errors.phone && (values.phone || options.phoneRequired) && !phone) {
		errors.phone = 'invalid_phone';
	}

	if (RESIDENT_FIELDS.some((field) => errors[field])) return null;
	return {
		nationalId: nationalId!,
		firstNames: values.first_names,
		lastNames: values.last_names,
		gender: values.gender as Gender,
		maritalStatus: values.marital_status as MaritalStatus,
		occupation: values.occupation || null,
		streetAddress: values.street_address,
		houseNumber: values.house_number || null,
		phone
	};
}

/** Admin edit of a resident: like the public form, but the phone is optional. */
export function validateResident(
	form: FormData
):
	| { ok: true; data: ResidentInput }
	| { ok: false; errors: FormErrors<ResidentField>; values: ResidentValues } {
	const values = readValues(form, RESIDENT_FIELDS);
	const errors = checkPresence(values, RESIDENT_MAX_LENGTH, [
		'occupation',
		'house_number',
		'phone'
	]);
	const data = checkResidentValues(values, errors, { phoneRequired: false });
	return data ? { ok: true, data } : { ok: false, errors, values };
}
