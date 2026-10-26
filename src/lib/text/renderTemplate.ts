export type TemplateValue = string | number | null | undefined;
export interface TemplateContext {
	[key: string]: TemplateValue | TemplateContext;
}

/**
 * Variables available to certificate body templates (see migrations/0004_real_templates.sql).
 * Built from the resident snapshot, council settings and signers when a certificate is approved.
 */
export interface CertificateTemplateContext extends TemplateContext {
	council: {
		name: string;
		state: string;
		municipality: string;
		parish: string;
		/** Reads after "domiciliadas en …": "el Sector “9 de Abril”, vía …". */
		sectorAddress: string;
		city: string;
	};
	resident: {
		/** Uppercase, as in the paper certificates. */
		fullName: string;
		/** `V-12887351` */
		nationalId: string;
		/** `12.887.351` */
		nationalIdNumber: string;
		maritalStatus: string;
		/** ", chofer" or "" when unknown (optional placeholder). */
		occupationPart: string;
		/** "calle La Pimienta, casa N° 05" */
		address: string;
		article: string;
		citizen: string;
		/** "al ciudadano" / "a la ciudadana" */
		toCitizen: string;
		/** "un ciudadano" / "una ciudadana" */
		aCitizen: string;
		/** "de él" / "de ella" */
		ofThem: string;
		nationality: string;
		domiciled: string;
	};
	certificate: {
		knownSince: string;
		/** "trece días del mes de julio de dos mil veintiséis" */
		issuedAtWords: string;
		/** Same, with its preposition: "a los trece días…" / "al primer día…". */
		issuedOn: string;
		/** "13-07-2026" */
		issuedDate: string;
	};
	signers: {
		/** "Nosotras" / "Nosotros" */
		pronoun: string;
		/** "ANA PÉREZ, LUISA DÍAZ y CARMEN RÍOS" */
		names: string;
		/** "16.842.708, 4.935.094 y 5.880.762" */
		nationalIds: string;
		/** "venezolanas" / "venezolanos" */
		nationality: string;
		/** "domiciliadas" / "domiciliados" */
		domiciled: string;
		/** "Voceras" / "Voceros" */
		spokespersons: string;
	};
}

export const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\s*\}\}/g;

function lookup(context: TemplateContext, path: string): TemplateValue | TemplateContext {
	let current: TemplateValue | TemplateContext = context;
	for (const key of path.split('.')) {
		if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) {
			return undefined;
		}
		current = current[key];
	}
	return current;
}

/** Lists the distinct placeholder paths used in a template, in order of appearance. */
export function extractPlaceholders(template: string): string[] {
	return [...new Set([...template.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]))];
}

/**
 * Placeholders in `template` that `context` cannot resolve to a number or a non-blank string.
 * Blank strings count as missing: they would leave a gap in the document.
 */
export function findMissingPlaceholders(template: string, context: TemplateContext): string[] {
	return extractPlaceholders(template).filter((path) => {
		const value = lookup(context, path);
		return typeof value === 'number' ? false : typeof value !== 'string' || value.trim() === '';
	});
}

/**
 * Replaces `{{path.to.value}}` placeholders with values from `context`.
 * Unresolved placeholders are left untouched so they stay visible during review.
 */
export function renderTemplate(template: string, context: TemplateContext): string {
	return template.replace(PLACEHOLDER_PATTERN, (placeholder, path: string) => {
		const value = lookup(context, path);
		return typeof value === 'string' || typeof value === 'number' ? String(value) : placeholder;
	});
}
