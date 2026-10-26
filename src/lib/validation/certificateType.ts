import {
	isTemplatePlaceholder,
	REQUIRED_PLACEHOLDERS,
	type TemplatePlaceholder
} from '#lib/certificates/templatePlaceholders.ts';
import { extractPlaceholders, PLACEHOLDER_PATTERN } from '#lib/text/renderTemplate.ts';
import { checkPresence, cleanText, readValues, type FormErrors } from './form.ts';

export const CERTIFICATE_TYPE_FIELDS = ['title', 'body_template'] as const;
export type CertificateTypeField = (typeof CERTIFICATE_TYPE_FIELDS)[number];
export type CertificateTypeValues = Record<CertificateTypeField, string> & { is_active: boolean };

export interface CertificateTypeInput {
	title: string;
	bodyTemplate: string;
	isActive: boolean;
}

/** Problems specific to the template text, shown above the editor. */
export interface TemplateProblems {
	/** `{{something}}` that is not a known placeholder (typos). */
	unknown: string[];
	/** Required placeholders that are missing. */
	missingRequired: TemplatePlaceholder[];
	/** Braces outside placeholders, e.g. a placeholder with a missing brace. */
	strayBraces: boolean;
}

const MAX_LENGTH: Record<CertificateTypeField, number> = { title: 80, body_template: 4000 };

export function findTemplateProblems(template: string): TemplateProblems {
	const used = extractPlaceholders(template);
	return {
		unknown: used.filter((path) => !isTemplatePlaceholder(path)),
		missingRequired: REQUIRED_PLACEHOLDERS.filter((path) => !used.includes(path)),
		strayBraces: /[{}]/.test(template.replace(PLACEHOLDER_PATTERN, ''))
	};
}

export const hasTemplateProblems = (problems: TemplateProblems) =>
	problems.unknown.length > 0 || problems.missingRequired.length > 0 || problems.strayBraces;

export function validateCertificateType(form: FormData):
	| { ok: true; data: CertificateTypeInput }
	| {
			ok: false;
			errors: FormErrors<CertificateTypeField>;
			problems: TemplateProblems | null;
			values: CertificateTypeValues;
	  } {
	const values: CertificateTypeValues = {
		...readValues(form, CERTIFICATE_TYPE_FIELDS),
		// The body is one paragraph in the PDF: line breaks become spaces.
		body_template: cleanText(form.get('body_template')),
		is_active: form.get('is_active') === 'on'
	};
	const errors = checkPresence(values, MAX_LENGTH);
	const problems = errors.body_template ? null : findTemplateProblems(values.body_template);

	if (Object.keys(errors).length > 0 || (problems && hasTemplateProblems(problems))) {
		return { ok: false, errors, problems, values };
	}
	return {
		ok: true,
		data: { title: values.title, bodyTemplate: values.body_template, isActive: values.is_active }
	};
}
