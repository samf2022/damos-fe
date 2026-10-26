// Validation for the public certificate request form. Pure and shared, so the server action
// and tests use the same rules. Messages live in es.ts, keyed by the error codes below.
import type { MaritalStatus } from '#lib/text/genderAgreement.ts';
import type { Gender } from '#lib/types.ts';
import { checkPresence, readValues, type FormErrors } from './form.ts';
import { checkResidentValues, normalizeNationalId, RESIDENT_MAX_LENGTH } from './resident.ts';

export { normalizeNationalId };

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

export type RequestErrors = FormErrors<RequestField>;

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
	...RESIDENT_MAX_LENGTH,
	certificate_type_id: 64,
	known_since_text: 60
};

const OPTIONAL_FIELDS: readonly RequestField[] = ['occupation', 'house_number'];

export function readRequestValues(form: FormData): RequestValues {
	return readValues(form, REQUEST_FIELDS);
}

export function validateCertificateRequest(form: FormData): ValidationResult {
	const values = readRequestValues(form);
	const errors = checkPresence(values, MAX_LENGTH, OPTIONAL_FIELDS);

	const resident = checkResidentValues(values, errors, { phoneRequired: true });

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };

	return {
		ok: true,
		data: {
			...resident!,
			phone: resident!.phone!,
			certificateTypeId: values.certificate_type_id,
			knownSinceText: values.known_since_text
		}
	};
}
