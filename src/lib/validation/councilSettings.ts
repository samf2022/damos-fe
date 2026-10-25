import { checkPresence, readValues, type FormErrors } from './form.ts';

export const COUNCIL_FIELDS = [
	'name',
	'tax_id',
	'state',
	'municipality',
	'parish',
	'sector_address',
	'city',
	'validity_months',
	'validity_note'
] as const;

export type CouncilField = (typeof COUNCIL_FIELDS)[number];
export type CouncilValues = Record<CouncilField, string>;

export interface CouncilSettingsInput {
	name: string;
	/** Canonical form: `J-12345678-9`. */
	taxId: string | null;
	state: string;
	municipality: string;
	parish: string;
	sectorAddress: string;
	city: string;
	validityMonths: number;
	validityNote: string | null;
}

const MAX_LENGTH: Record<CouncilField, number> = {
	name: 120,
	tax_id: 20,
	state: 80,
	municipality: 80,
	parish: 80,
	sector_address: 160,
	city: 80,
	validity_months: 2,
	validity_note: 300
};

export const MAX_VALIDITY_MONTHS = 24;

/** Normalizes a RIF (`j40062883-0`, `J-40062883-0`, `J400628830`) to `J-40062883-0`. */
export function normalizeTaxId(value: string): string | null {
	const match = /^([JGVEPC])[\s-]*(\d{8})[\s-]*(\d)$/i.exec(value.trim());
	return match ? `${match[1].toUpperCase()}-${match[2]}-${match[3]}` : null;
}

export function validateCouncilSettings(
	form: FormData
):
	| { ok: true; data: CouncilSettingsInput }
	| { ok: false; errors: FormErrors<CouncilField>; values: CouncilValues } {
	const values = readValues(form, COUNCIL_FIELDS, ['validity_note']);
	const errors = checkPresence(values, MAX_LENGTH, ['tax_id', 'validity_note']);

	const taxId = values.tax_id ? normalizeTaxId(values.tax_id) : null;
	if (!errors.tax_id && values.tax_id && !taxId) errors.tax_id = 'invalid_tax_id';

	const months = Number(values.validity_months);
	if (
		!errors.validity_months &&
		(!Number.isInteger(months) || months < 1 || months > MAX_VALIDITY_MONTHS)
	) {
		errors.validity_months = 'invalid_number';
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };
	return {
		ok: true,
		data: {
			name: values.name,
			taxId,
			state: values.state,
			municipality: values.municipality,
			parish: values.parish,
			sectorAddress: values.sector_address,
			city: values.city,
			validityMonths: months,
			validityNote: values.validity_note || null
		}
	};
}
