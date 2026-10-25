import { numberToSpanishWords } from './numberToSpanishWords';

export const SPANISH_MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre'
] as const;

export const VENEZUELA_TIME_ZONE = 'America/Caracas';

interface DateParts {
	year: number;
	month: number;
	day: number;
}

function toDateParts(input: string | Date, timeZone: string): DateParts {
	if (typeof input === 'string' && input.length > 10) {
		// Full ISO timestamp (e.g. `issued_at`): treat it as an instant.
		const instant = new Date(input);
		if (Number.isNaN(instant.getTime())) throw new RangeError(`Invalid ISO date: ${input}`);
		return toDateParts(instant, timeZone);
	}

	if (typeof input === 'string') {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
		if (!match) throw new RangeError(`Invalid ISO date: ${input}`);
		const [year, month, day] = match.slice(1).map(Number);
		const check = new Date(Date.UTC(year, month - 1, day));
		if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
			throw new RangeError(`Invalid ISO date: ${input}`);
		}
		return { year, month, day };
	}

	// A Date is an instant: resolve the calendar day in the council's time zone.
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(input);
	const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
	return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Formats a date as used in Venezuelan certificates.
 *
 * - `2026-07-13` → "trece días del mes de julio de dos mil veintiséis"
 * - `2026-07-01` → "primer día del mes de julio de dos mil veintiséis"
 * - `2026-07-21` → "veintiún días del mes de julio de dos mil veintiséis"
 *
 * `YYYY-MM-DD` strings are read as calendar dates; full ISO timestamps and `Date` objects are
 * instants resolved to a calendar day in `timeZone`.
 */
export function dateToSpanishWords(
	input: string | Date,
	timeZone: string = VENEZUELA_TIME_ZONE
): string {
	const { year, month, day } = toDateParts(input, timeZone);
	const dayWords =
		day === 1 ? 'primer día' : `${numberToSpanishWords(day, { masculineNoun: true })} días`;
	return `${dayWords} del mes de ${SPANISH_MONTHS[month - 1]} de ${numberToSpanishWords(year)}`;
}
