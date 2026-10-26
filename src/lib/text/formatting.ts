/** "A", "A y B", "A, B y C". */
export function joinSpanishList(items: readonly string[]): string {
	if (items.length <= 1) return items.join('');
	return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

/**
 * Cédula as written in certificates: `V-12887351` → `12.887.351`.
 * Foreign ids keep their prefix: `E-81234567` → `E-81.234.567`.
 */
export function formatNationalIdNumber(nationalId: string): string {
	const match = /^([VE])-(\d+)$/.exec(nationalId);
	if (!match) return nationalId;
	const dotted = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	return match[1] === 'E' ? `E-${dotted}` : dotted;
}

/** Uppercases with Spanish rules (keeps accents: "Cedeño" → "CEDEÑO"). */
export function toUpperName(name: string): string {
	return name.toLocaleUpperCase('es-VE');
}

const LOWERCASE_CONNECTORS = new Set(['de', 'del', 'y']);

/**
 * Street address as written in certificates: lowercase first letter ("calle La Paz"). Text typed
 * in capitals is title-cased first ("CALLE EL PORVENIR" → "calle El Porvenir"); abbreviations
 * with periods ("C.A.") are kept; "AV." becomes "av.".
 */
export function toAddressCase(address: string): string {
	const text = address.trim();
	const allCaps = text === text.toLocaleUpperCase('es-VE') && /\p{L}/u.test(text);
	const cased = allCaps
		? text.replace(/[^\s,]+/g, (word) => {
				if (/\.\S/.test(word)) return word;
				const lower = word.toLocaleLowerCase('es-VE');
				return LOWERCASE_CONNECTORS.has(lower)
					? lower
					: lower.charAt(0).toLocaleUpperCase('es-VE') + lower.slice(1);
			})
		: text;
	return cased.charAt(0).toLocaleLowerCase('es-VE') + cased.slice(1);
}
