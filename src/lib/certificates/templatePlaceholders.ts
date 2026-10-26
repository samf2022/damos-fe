// The placeholders a certificate template may use, grouped for the editor. They are exactly
// the paths of CertificateTemplateContext (a test checks it); labels live in es.ts.

export const TEMPLATE_PLACEHOLDER_GROUPS = {
	signers: [
		'signers.pronoun',
		'signers.names',
		'signers.nationalIds',
		'signers.nationality',
		'signers.domiciled',
		'signers.spokespersons'
	],
	resident: [
		'resident.fullName',
		'resident.nationalId',
		'resident.nationalIdNumber',
		'resident.nationality',
		'resident.maritalStatus',
		'resident.occupationPart',
		'resident.address',
		'resident.domiciled',
		'resident.toCitizen',
		'resident.aCitizen',
		'resident.ofThem',
		'resident.article',
		'resident.citizen'
	],
	council: [
		'council.name',
		'council.sectorAddress',
		'council.parish',
		'council.municipality',
		'council.state',
		'council.city'
	],
	certificate: [
		'certificate.knownSince',
		'certificate.issuedOn',
		'certificate.issuedAtWords',
		'certificate.issuedDate'
	]
} as const;

export type TemplatePlaceholderGroup = keyof typeof TEMPLATE_PLACEHOLDER_GROUPS;
export type TemplatePlaceholder =
	(typeof TEMPLATE_PLACEHOLDER_GROUPS)[TemplatePlaceholderGroup][number];

export const TEMPLATE_PLACEHOLDERS: readonly TemplatePlaceholder[] = Object.values(
	TEMPLATE_PLACEHOLDER_GROUPS
).flat();

export const isTemplatePlaceholder = (path: string): path is TemplatePlaceholder =>
	(TEMPLATE_PLACEHOLDERS as readonly string[]).includes(path);

/** Every certificate must name the resident (it is also printed upright in the PDF). */
export const REQUIRED_PLACEHOLDERS: readonly TemplatePlaceholder[] = ['resident.fullName'];
