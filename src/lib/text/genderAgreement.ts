import type { Gender } from '#lib/types.ts';

/** Words whose form depends on the grammatical gender of the person they refer to. */
const GENDERED_WORDS = {
	article: { M: 'el', F: 'la' },
	citizen: { M: 'ciudadano', F: 'ciudadana' },
	venezuelan: { M: 'venezolano', F: 'venezolana' },
	foreign: { M: 'extranjero', F: 'extranjera' },
	domiciled: { M: 'domiciliado', F: 'domiciliada' },
	resident: { M: 'residenciado', F: 'residenciada' },
	known: { M: 'conocido', F: 'conocida' },
	interested: { M: 'el interesado', F: 'la interesada' },
	toCitizen: { M: 'al ciudadano', F: 'a la ciudadana' },
	aCitizen: { M: 'un ciudadano', F: 'una ciudadana' },
	ofThem: { M: 'de él', F: 'de ella' }
} as const satisfies Record<string, Record<Gender, string>>;

export type GenderedWord = keyof typeof GENDERED_WORDS;

export function agree(word: GenderedWord, gender: Gender): string {
	return GENDERED_WORDS[word][gender];
}

export const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed', 'cohabiting'] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

const MARITAL_STATUS_WORDS: Record<MaritalStatus, Record<Gender, string>> = {
	single: { M: 'soltero', F: 'soltera' },
	married: { M: 'casado', F: 'casada' },
	divorced: { M: 'divorciado', F: 'divorciada' },
	widowed: { M: 'viudo', F: 'viuda' },
	cohabiting: { M: 'en unión estable de hecho', F: 'en unión estable de hecho' }
};

export function isMaritalStatus(value: unknown): value is MaritalStatus {
	return typeof value === 'string' && (MARITAL_STATUSES as readonly string[]).includes(value);
}

export function maritalStatusWord(status: MaritalStatus, gender: Gender): string {
	return MARITAL_STATUS_WORDS[status][gender];
}

/**
 * "Nosotras" only when every signer is female; Spanish uses the masculine
 * plural for mixed groups. An empty list defaults to "Nosotros".
 */
export function signersPronoun(genders: readonly Gender[]): 'Nosotras' | 'Nosotros' {
	return genders.length > 0 && genders.every((gender) => gender === 'F') ? 'Nosotras' : 'Nosotros';
}

/** All gendered words for a resident, ready to be used as template variables. */
export function residentGenderedWords(gender: Gender): Record<GenderedWord, string> {
	return Object.fromEntries(
		Object.entries(GENDERED_WORDS).map(([word, forms]) => [word, forms[gender]])
	) as Record<GenderedWord, string>;
}

/** Plural forms for the group of signers: feminine only when every signer is female. */
export function signersGroupWords(genders: readonly Gender[]) {
	const feminine = genders.length > 0 && genders.every((gender) => gender === 'F');
	return {
		pronoun: feminine ? 'Nosotras' : 'Nosotros',
		nationality: feminine ? 'venezolanas' : 'venezolanos',
		domiciled: feminine ? 'domiciliadas' : 'domiciliados',
		spokespersons: feminine ? 'Voceras' : 'Voceros'
	};
}
