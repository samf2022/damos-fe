// Builds the template variables for a certificate and renders its body. Pure and shared:
// the admin review page uses it for the live preview, the approve action for the final text.
import { dateToSpanishPhrase, dateToSpanishWords } from '#lib/text/dateToSpanishWords.ts';
import {
	agree,
	isMaritalStatus,
	maritalStatusWord,
	signersPronoun
} from '#lib/text/genderAgreement.ts';
import {
	findMissingPlaceholders,
	renderTemplate,
	type CertificateTemplateContext
} from '#lib/text/renderTemplate.ts';
import type { Gender, ResidentSnapshot } from '#lib/types.ts';

export interface CouncilForTemplate {
	name: string;
	state: string;
	municipality: string;
	parish: string;
	sector_address: string;
	city: string;
}

export interface CertificateBodyInput {
	template: string;
	council: CouncilForTemplate;
	resident: ResidentSnapshot;
	signerGenders: readonly Gender[];
	knownSinceText: string;
	/** ISO timestamp of issuance (resolved to a day in Venezuela time). */
	issuedAt: string;
}

export function residentAddress(resident: Pick<ResidentSnapshot, 'streetAddress' | 'houseNumber'>) {
	return resident.houseNumber
		? `${resident.streetAddress}, casa ${resident.houseNumber}`
		: resident.streetAddress;
}

export function buildCertificateContext(input: CertificateBodyInput): CertificateTemplateContext {
	const { resident, council } = input;
	const isForeign = resident.nationalId.startsWith('E-');
	return {
		council: {
			name: council.name,
			state: council.state,
			municipality: council.municipality,
			parish: council.parish,
			sectorAddress: council.sector_address,
			city: council.city
		},
		resident: {
			fullName: `${resident.firstNames} ${resident.lastNames}`,
			nationalId: resident.nationalId,
			maritalStatus: isMaritalStatus(resident.maritalStatus)
				? maritalStatusWord(resident.maritalStatus, resident.gender)
				: '',
			address: residentAddress(resident),
			article: agree('article', resident.gender),
			citizen: agree('citizen', resident.gender),
			nationality: agree(isForeign ? 'foreign' : 'venezuelan', resident.gender),
			domiciled: agree('domiciled', resident.gender)
		},
		certificate: {
			knownSince: input.knownSinceText,
			issuedAtWords: dateToSpanishWords(input.issuedAt),
			issuedOn: dateToSpanishPhrase(input.issuedAt)
		},
		signers: {
			pronoun: signersPronoun(input.signerGenders)
		}
	};
}

export function renderCertificateBody(input: CertificateBodyInput): {
	body: string;
	/** Placeholders left unresolved or blank; approval must be blocked while non-empty. */
	missing: string[];
} {
	const context = buildCertificateContext(input);
	return {
		body: renderTemplate(input.template, context),
		missing: findMissingPlaceholders(input.template, context)
	};
}
