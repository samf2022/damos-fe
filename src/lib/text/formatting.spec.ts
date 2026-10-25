import { describe, expect, it } from 'vitest';
import { signersGroupWords } from './genderAgreement';
import { formatNationalIdNumber, joinSpanishList, toUpperName } from './formatting';

describe('joinSpanishList', () => {
	it('joins with commas and "y"', () => {
		expect(joinSpanishList([])).toBe('');
		expect(joinSpanishList(['A'])).toBe('A');
		expect(joinSpanishList(['A', 'B'])).toBe('A y B');
		expect(joinSpanishList(['A', 'B', 'C'])).toBe('A, B y C');
	});
});

describe('formatNationalIdNumber', () => {
	it.each([
		['V-12887351', '12.887.351'],
		['V-4935094', '4.935.094'],
		['V-123456', '123.456'],
		['E-81234567', 'E-81.234.567'],
		['raro', 'raro']
	])('%s → %s', (input, expected) => {
		expect(formatNationalIdNumber(input)).toBe(expected);
	});
});

describe('toUpperName', () => {
	it('keeps accents and ñ', () => {
		expect(toUpperName('José Cedeño Ríos')).toBe('JOSÉ CEDEÑO RÍOS');
	});
});

describe('signersGroupWords', () => {
	it('is feminine only when all signers are female', () => {
		expect(signersGroupWords(['F', 'F'])).toEqual({
			pronoun: 'Nosotras',
			nationality: 'venezolanas',
			domiciled: 'domiciliadas',
			spokespersons: 'Voceras'
		});
		expect(signersGroupWords(['F', 'M']).spokespersons).toBe('Voceros');
	});
});
