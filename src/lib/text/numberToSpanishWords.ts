const UNITS = [
	'cero',
	'uno',
	'dos',
	'tres',
	'cuatro',
	'cinco',
	'seis',
	'siete',
	'ocho',
	'nueve',
	'diez',
	'once',
	'doce',
	'trece',
	'catorce',
	'quince',
	'dieciséis',
	'diecisiete',
	'dieciocho',
	'diecinueve',
	'veinte',
	'veintiuno',
	'veintidós',
	'veintitrés',
	'veinticuatro',
	'veinticinco',
	'veintiséis',
	'veintisiete',
	'veintiocho',
	'veintinueve'
];

const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

const HUNDREDS = [
	'',
	'ciento',
	'doscientos',
	'trescientos',
	'cuatrocientos',
	'quinientos',
	'seiscientos',
	'setecientos',
	'ochocientos',
	'novecientos'
];

function belowHundred(n: number): string {
	if (n < 30) return UNITS[n];
	const tens = Math.floor(n / 10);
	const units = n % 10;
	return units === 0 ? TENS[tens] : `${TENS[tens]} y ${UNITS[units]}`;
}

function belowThousand(n: number): string {
	if (n === 100) return 'cien';
	const hundreds = Math.floor(n / 100);
	const rest = n % 100;
	if (hundreds === 0) return belowHundred(rest);
	return rest === 0 ? HUNDREDS[hundreds] : `${HUNDREDS[hundreds]} ${belowHundred(rest)}`;
}

/** Drops the final "uno" before a masculine noun: "veintiún días", "treinta y un años". */
export function apocopate(words: string): string {
	return words.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
}

/**
 * Converts an integer in [0, 999 999] to Spanish words.
 * `masculineNoun` applies apocope for use before a masculine noun ("un", "veintiún").
 */
export function numberToSpanishWords(n: number, options: { masculineNoun?: boolean } = {}): string {
	if (!Number.isInteger(n) || n < 0 || n > 999_999) {
		throw new RangeError(`Unsupported number: ${n}`);
	}

	let words: string;
	if (n < 1000) {
		words = belowThousand(n);
	} else {
		const thousands = Math.floor(n / 1000);
		const rest = n % 1000;
		const thousandsWords = thousands === 1 ? 'mil' : `${apocopate(belowThousand(thousands))} mil`;
		words = rest === 0 ? thousandsWords : `${thousandsWords} ${belowThousand(rest)}`;
	}

	return options.masculineNoun ? apocopate(words) : words;
}
