// Small helpers shared by form validators. Error codes map to messages in es.formErrors.

export type FormErrorCode =
	| 'required'
	| 'too_long'
	| 'invalid_national_id'
	| 'invalid_tax_id'
	| 'invalid_name'
	| 'invalid_option'
	| 'invalid_phone'
	| 'invalid_number';

export type FormErrors<Field extends string> = Partial<Record<Field, FormErrorCode>>;

/** Trims and collapses internal whitespace; non-string entries (files) become ''. */
export function cleanText(value: FormDataEntryValue | null): string {
	return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/** Like cleanText but keeps line breaks (for multi-line notes). */
export function cleanMultiline(value: FormDataEntryValue | null): string {
	return typeof value === 'string'
		? value
				.replace(/\r\n?/g, '\n')
				.split('\n')
				.map((line) => line.replace(/\s+/g, ' ').trim())
				.join('\n')
				.trim()
		: '';
}

export function readValues<Field extends string>(
	form: FormData,
	fields: readonly Field[],
	multiline: readonly Field[] = []
): Record<Field, string> {
	return Object.fromEntries(
		fields.map((field) => [
			field,
			multiline.includes(field) ? cleanMultiline(form.get(field)) : cleanText(form.get(field))
		])
	) as Record<Field, string>;
}

/** Applies required / max-length rules; returns the errors found. */
export function checkPresence<Field extends string>(
	values: Record<Field, string>,
	maxLength: Record<Field, number>,
	optional: readonly Field[] = []
): FormErrors<Field> {
	const errors: FormErrors<Field> = {};
	for (const field of Object.keys(maxLength) as Field[]) {
		if (!values[field] && !optional.includes(field)) errors[field] = 'required';
		else if (values[field].length > maxLength[field]) errors[field] = 'too_long';
	}
	return errors;
}

/** Letters (including accents and ñ), spaces, apostrophes, dots and hyphens. */
export const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;
