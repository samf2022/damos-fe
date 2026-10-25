import type { Gender } from '#lib/types.ts';
import { formatVenezuelanPhone } from '#lib/whatsapp.ts';
import { normalizeNationalId } from './certificateRequest.ts';
import { checkPresence, NAME_PATTERN, readValues, type FormErrors } from './form.ts';

export const SIGNER_FIELDS = [
	'full_name',
	'short_name',
	'national_id',
	'role_title',
	'phone',
	'gender',
	'display_order'
] as const;

export type SignerField = (typeof SIGNER_FIELDS)[number];
export type SignerValues = Record<SignerField, string> & { certificate_type_ids: string[] };

export interface SignerInput {
	fullName: string;
	shortName: string;
	/** Canonical form: `V-12345678`. */
	nationalId: string;
	roleTitle: string;
	/** Canonical form: `0412-1234567`. */
	phone: string | null;
	gender: Gender;
	displayOrder: number;
	/** Certificate types this signer signs by default. */
	certificateTypeIds: string[];
}

const MAX_LENGTH: Record<SignerField, number> = {
	full_name: 120,
	short_name: 60,
	national_id: 20,
	role_title: 60,
	phone: 20,
	gender: 1,
	display_order: 3
};

export function validateSigner(
	form: FormData
):
	| { ok: true; data: SignerInput }
	| { ok: false; errors: FormErrors<SignerField>; values: SignerValues } {
	const values: SignerValues = {
		...readValues(form, SIGNER_FIELDS),
		certificate_type_ids: form.getAll('certificate_type_ids').map(String)
	};
	const errors = checkPresence(values, MAX_LENGTH, ['phone', 'display_order']);

	for (const field of ['full_name', 'short_name'] as const) {
		if (!errors[field] && !NAME_PATTERN.test(values[field])) errors[field] = 'invalid_name';
	}

	const nationalId = normalizeNationalId(values.national_id);
	if (!errors.national_id && !nationalId) errors.national_id = 'invalid_national_id';

	const phone = values.phone ? formatVenezuelanPhone(values.phone) : null;
	if (!errors.phone && values.phone && !phone) errors.phone = 'invalid_phone';

	if (!errors.gender && values.gender !== 'F' && values.gender !== 'M') {
		errors.gender = 'invalid_option';
	}

	const displayOrder = values.display_order ? Number(values.display_order) : 0;
	if (!errors.display_order && (!Number.isInteger(displayOrder) || displayOrder < 0)) {
		errors.display_order = 'invalid_number';
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };
	return {
		ok: true,
		data: {
			fullName: values.full_name,
			shortName: values.short_name,
			nationalId: nationalId!,
			roleTitle: values.role_title,
			phone,
			gender: values.gender as Gender,
			displayOrder,
			certificateTypeIds: [...new Set(values.certificate_type_ids)]
		}
	};
}
