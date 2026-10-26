// Builds the template variables for a certificate and renders its body. Pure and shared:
// the admin review page uses it for the live preview, the approve action for the final text.
import {
	dateToSpanishPhrase,
	dateToSpanishWords,
	VENEZUELA_TIME_ZONE
} from '#lib/text/dateToSpanishWords.ts';
import {
	formatNationalIdNumber,
	joinSpanishList,
	toAddressCase,
	toUpperName
} from '#lib/text/formatting.ts';
import {
	agree,
	isMaritalStatus,
	maritalStatusWord,
	signersGroupWords
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

export interface SignerForTemplate {
	fullName: string;
	nationalId: string;
	gender: Gender;
}

export interface CertificateBodyInput {
	template: string;
	council: CouncilForTemplate;
	resident: ResidentSnapshot;
	/** In the order they appear in the document. */
	signers: readonly SignerForTemplate[];
	knownSinceText: string;
	/** ISO timestamp of issuance (resolved to a day in Venezuela time). */
	issuedAt: string;
}

/** Placeholders that may legitimately render empty. */
const OPTIONAL_PLACEHOLDERS = new Set(['resident.occupationPart']);

/** The text needs a plural group of signers ("hacemos constar", "conocemos"). */
export const MIN_SIGNERS = 2;

export function residentAddress(resident: Pick<ResidentSnapshot, 'streetAddress' | 'houseNumber'>) {
	return resident.houseNumber
		? `${resident.streetAddress}, casa N° ${resident.houseNumber}`
		: resident.streetAddress;
}

/** "20" → "20 años": the field asks for a period, but a bare number is a common answer. */
export function normalizeKnownSince(text: string): string {
	const trimmed = text.trim();
	if (!/^\d+$/.test(trimmed)) return trimmed;
	return `${Number(trimmed)} ${Number(trimmed) === 1 ? 'año' : 'años'}`;
}

function numericDate(iso: string): string {
	const parts = new Intl.DateTimeFormat('es-VE', {
		timeZone: VENEZUELA_TIME_ZONE,
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).formatToParts(new Date(iso));
	const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
	return `${get('day')}-${get('month')}-${get('year')}`;
}

export function buildCertificateContext(input: CertificateBodyInput): CertificateTemplateContext {
	const { resident, council } = input;
	const gender = resident.gender;
	const isForeign = resident.nationalId.startsWith('E-');
	const occupation = resident.occupation?.trim().toLocaleLowerCase('es-VE');
	const group = signersGroupWords(input.signers.map((signer) => signer.gender));

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
			fullName: toUpperName(`${resident.firstNames} ${resident.lastNames}`),
			nationalId: resident.nationalId,
			nationalIdNumber: formatNationalIdNumber(resident.nationalId),
			maritalStatus: isMaritalStatus(resident.maritalStatus)
				? maritalStatusWord(resident.maritalStatus, gender)
				: '',
			occupationPart: occupation ? `, ${occupation}` : '',
			address: residentAddress({
				...resident,
				streetAddress: toAddressCase(resident.streetAddress)
			}),
			article: agree('article', gender),
			citizen: agree('citizen', gender),
			toCitizen: agree('toCitizen', gender),
			aCitizen: agree('aCitizen', gender),
			ofThem: agree('ofThem', gender),
			nationality: agree(isForeign ? 'foreign' : 'venezuelan', gender),
			domiciled: agree('domiciled', gender)
		},
		certificate: {
			knownSince: normalizeKnownSince(input.knownSinceText),
			issuedAtWords: dateToSpanishWords(input.issuedAt),
			issuedOn: dateToSpanishPhrase(input.issuedAt),
			issuedDate: numericDate(input.issuedAt)
		},
		signers: {
			...group,
			names: joinSpanishList(input.signers.map((signer) => toUpperName(signer.fullName))),
			nationalIds: joinSpanishList(
				input.signers.map((signer) => formatNationalIdNumber(signer.nationalId))
			)
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
		missing: findMissingPlaceholders(input.template, context).filter(
			(path) => !OPTIONAL_PLACEHOLDERS.has(path)
		)
	};
}
