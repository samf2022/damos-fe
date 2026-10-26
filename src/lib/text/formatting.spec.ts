import { describe, expect, it } from 'vitest';
import { signersGroupWords } from './genderAgreement';
import { formatNationalIdNumber, joinSpanishList, toAddressCase, toUpperName } from './formatting';

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

describe('toAddressCase', () => {
	it('lowercases the first letter and keeps the rest as typed', () => {
		expect(toAddressCase('Calle La Paz')).toBe('calle La Paz');
		expect(toAddressCase(' Carretera Vía Nacional Carúpano – San José ')).toBe(
			'carretera Vía Nacional Carúpano – San José'
		);
	});

	it('title-cases text typed in capitals', () => {
		expect(toAddressCase('CALLE EL PORVENIR')).toBe('calle El Porvenir');
		expect(toAddressCase('AV. PRINCIPAL DE LA ÑAMERA, SECTOR 5 Y 6')).toBe(
			'av. Principal de La Ñamera, Sector 5 y 6'
		);
		expect(toAddressCase('SECTOR AUTORICA C.A.')).toBe('sector Autorica C.A.');
	});
});
