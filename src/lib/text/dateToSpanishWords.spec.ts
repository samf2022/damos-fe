import { describe, expect, it } from 'vitest';
import { dateToSpanishPhrase, dateToSpanishWords } from './dateToSpanishWords';
import { numberToSpanishWords } from './numberToSpanishWords';

describe('numberToSpanishWords', () => {
	it.each([
		[0, 'cero'],
		[1, 'uno'],
		[16, 'dieciséis'],
		[21, 'veintiuno'],
		[22, 'veintidós'],
		[30, 'treinta'],
		[31, 'treinta y uno'],
		[100, 'cien'],
		[101, 'ciento uno'],
		[500, 'quinientos'],
		[1000, 'mil'],
		[1999, 'mil novecientos noventa y nueve'],
		[2000, 'dos mil'],
		[2026, 'dos mil veintiséis'],
		[21000, 'veintiún mil'],
		[101000, 'ciento un mil']
	])('%i → %s', (n, words) => {
		expect(numberToSpanishWords(n)).toBe(words);
	});

	it('applies apocope before masculine nouns', () => {
		expect(numberToSpanishWords(1, { masculineNoun: true })).toBe('un');
		expect(numberToSpanishWords(21, { masculineNoun: true })).toBe('veintiún');
		expect(numberToSpanishWords(31, { masculineNoun: true })).toBe('treinta y un');
	});

	it('rejects unsupported numbers', () => {
		expect(() => numberToSpanishWords(-1)).toThrow(RangeError);
		expect(() => numberToSpanishWords(1.5)).toThrow(RangeError);
	});
});

describe('dateToSpanishWords', () => {
	it('formats the reference example', () => {
		expect(dateToSpanishWords('2026-07-13')).toBe(
			'trece días del mes de julio de dos mil veintiséis'
		);
	});

	it('uses "primer día" for the first of the month', () => {
		expect(dateToSpanishWords('2026-07-01')).toBe(
			'primer día del mes de julio de dos mil veintiséis'
		);
	});

	it.each([
		['2026-02-02', 'dos días del mes de febrero de dos mil veintiséis'],
		['2026-10-21', 'veintiún días del mes de octubre de dos mil veintiséis'],
		['2027-12-31', 'treinta y un días del mes de diciembre de dos mil veintisiete'],
		['2030-09-16', 'dieciséis días del mes de septiembre de dos mil treinta']
	])('%s → %s', (date, words) => {
		expect(dateToSpanishWords(date)).toBe(words);
	});

	it('resolves instants in Venezuela time', () => {
		// 02:00 UTC on July 14 is still July 13 in Caracas (UTC-4).
		expect(dateToSpanishWords('2026-07-14T02:00:00.000Z')).toBe(
			'trece días del mes de julio de dos mil veintiséis'
		);
		expect(dateToSpanishWords(new Date('2026-07-01T12:00:00Z'))).toBe(
			'primer día del mes de julio de dos mil veintiséis'
		);
	});

	it('rejects invalid dates', () => {
		expect(() => dateToSpanishWords('2026-02-30')).toThrow(RangeError);
		expect(() => dateToSpanishWords('13/07/2026')).toThrow(RangeError);
	});
});

describe('dateToSpanishPhrase', () => {
	it('adds the right preposition', () => {
		expect(dateToSpanishPhrase('2026-07-13')).toBe(
			'a los trece días del mes de julio de dos mil veintiséis'
		);
		expect(dateToSpanishPhrase('2026-07-01')).toBe(
			'al primer día del mes de julio de dos mil veintiséis'
		);
	});
});
