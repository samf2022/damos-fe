// Validation for the public certificate request form. Pure and shared, so the server action
// and tests use the same rules. Messages live in es.ts, keyed by the error codes below.
import { isMaritalStatus, type MaritalStatus } from '#lib/text/genderAgreement.ts';
import type { Gender } from '#lib/types.ts';
import { formatVenezuelanPhone } from '#lib/whatsapp.ts';

export const REQUEST_FIELDS = [
	'certificate_type_id',
	'national_id',
	'first_names',
	'last_names',
	'gender',
	'marital_status',
	'occupation',
	'street_address',
	'house_number',
	'phone',
	'known_since_text'
] as const;

export type RequestField = (typeof REQUEST_FIELDS)[number];
export type RequestValues = Record<RequestField, string>;

export type RequestErrorCode =
	| 'required'
	| 'too_long'
	| 'invalid_national_id'
	| 'invalid_name'
	| 'invalid_option'
	| 'invalid_phone';

export type RequestErrors = Partial<Record<RequestField, RequestErrorCode>>;

export interface CertificateRequestInput {
	certificateTypeId: string;
	/** Canonical form: `V-12345678` or `E-12345678`. */
	nationalId: string;
	firstNames: string;
	lastNames: string;
	gender: Gender;
	maritalStatus: MaritalStatus;
	occupation: string | null;
	streetAddress: string;
	houseNumber: string | null;
	/** Canonical form: `0412-1234567`. */
	phone: string;
	knownSinceText: string;
}

export type ValidationResult =
	| { ok: true; data: CertificateRequestInput }
	| { ok: false; errors: RequestErrors; values: RequestValues };

const MAX_LENGTH: Record<RequestField, number> = {
	certificate_type_id: 64,
	national_id: 20,
	first_names: 80,
	last_names: 80,
	gender: 1,
	marital_status: 20,
	occupation: 80,
	street_address: 160,
	house_number: 40,
	phone: 20,
	known_since_text: 60
};

const OPTIONAL_FIELDS: ReadonlySet<RequestField> = new Set(['occupation', 'house_number']);

/** Letters (including accents and ñ), spaces, apostrophes, dots and hyphens. */
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;

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

/** Collapses internal whitespace and trims. */
function clean(value: FormDataEntryValue | null): string {
	return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function readRequestValues(form: FormData): RequestValues {
	return Object.fromEntries(
		REQUEST_FIELDS.map((field) => [field, clean(form.get(field))])
	) as RequestValues;
}

export function validateCertificateRequest(form: FormData): ValidationResult {
	const values = readRequestValues(form);
	const errors: RequestErrors = {};

	for (const field of REQUEST_FIELDS) {
		if (!values[field] && !OPTIONAL_FIELDS.has(field)) errors[field] = 'required';
		else if (values[field].length > MAX_LENGTH[field]) errors[field] = 'too_long';
	}

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

	const phone = formatVenezuelanPhone(values.phone);
	if (!errors.phone && !phone) errors.phone = 'invalid_phone';

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };

	return {
		ok: true,
		data: {
			certificateTypeId: values.certificate_type_id,
			nationalId: nationalId!,
			firstNames: values.first_names,
			lastNames: values.last_names,
			gender: values.gender as Gender,
			maritalStatus: values.marital_status as MaritalStatus,
			occupation: values.occupation || null,
			streetAddress: values.street_address,
			houseNumber: values.house_number || null,
			phone: phone!,
			knownSinceText: values.known_since_text
		}
	};
}
