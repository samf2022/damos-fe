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
