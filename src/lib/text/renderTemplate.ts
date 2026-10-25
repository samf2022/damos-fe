export type TemplateValue = string | number | null | undefined;
export interface TemplateContext {
	[key: string]: TemplateValue | TemplateContext;
}

/**
 * Variables available to certificate body templates (see migrations/0002_seed.sql).
 * Built from the resident snapshot, council settings and signers when a certificate is approved.
 */
export interface CertificateTemplateContext extends TemplateContext {
	council: {
		name: string;
		state: string;
		municipality: string;
		parish: string;
		sectorAddress: string;
		city: string;
	};
	resident: {
		fullName: string;
		nationalId: string;
		maritalStatus: string;
		address: string;
		article: string;
		citizen: string;
		nationality: string;
		domiciled: string;
	};
	certificate: {
		knownSince: string;
		issuedAtWords: string;
	};
	signers: {
		pronoun: string;
	};
}

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\s*\}\}/g;

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
	return [...new Set([...template.matchAll(PLACEHOLDER)].map((match) => match[1]))];
}

/** Placeholders in `template` that `context` cannot resolve to a string or number. */
export function findMissingPlaceholders(template: string, context: TemplateContext): string[] {
	return extractPlaceholders(template).filter((path) => {
		const value = lookup(context, path);
		return typeof value !== 'string' && typeof value !== 'number';
	});
}

/**
 * Replaces `{{path.to.value}}` placeholders with values from `context`.
 * Unresolved placeholders are left untouched so they stay visible during review.
 */
export function renderTemplate(template: string, context: TemplateContext): string {
	return template.replace(PLACEHOLDER, (placeholder, path: string) => {
		const value = lookup(context, path);
		return typeof value === 'string' || typeof value === 'number' ? String(value) : placeholder;
	});
}
