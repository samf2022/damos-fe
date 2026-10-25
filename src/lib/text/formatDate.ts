import { VENEZUELA_TIME_ZONE } from './dateToSpanishWords.ts';

/** "13 de julio de 2026", in Venezuela time. */
export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('es-VE', {
		dateStyle: 'long',
		timeZone: VENEZUELA_TIME_ZONE
	}).format(new Date(iso));
}
