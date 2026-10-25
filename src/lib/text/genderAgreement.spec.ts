import { describe, expect, it } from 'vitest';
import {
	agree,
	isMaritalStatus,
	maritalStatusWord,
	residentGenderedWords,
	signersPronoun
} from './genderAgreement';

describe('agree', () => {
	it.each([
		['citizen', 'ciudadano', 'ciudadana'],
		['venezuelan', 'venezolano', 'venezolana'],
		['domiciled', 'domiciliado', 'domiciliada'],
		['article', 'el', 'la']
	] as const)('%s → %s / %s', (word, masculine, feminine) => {
		expect(agree(word, 'M')).toBe(masculine);
		expect(agree(word, 'F')).toBe(feminine);
	});
});

describe('maritalStatusWord', () => {
	it('agrees with the resident gender', () => {
		expect(maritalStatusWord('single', 'M')).toBe('soltero');
		expect(maritalStatusWord('single', 'F')).toBe('soltera');
		expect(maritalStatusWord('widowed', 'F')).toBe('viuda');
		expect(maritalStatusWord('cohabiting', 'M')).toBe('en unión estable de hecho');
	});

	it('validates marital status codes', () => {
		expect(isMaritalStatus('married')).toBe(true);
		expect(isMaritalStatus('soltero')).toBe(false);
		expect(isMaritalStatus(null)).toBe(false);
	});
});

describe('signersPronoun', () => {
	it('uses "Nosotras" only when all signers are female', () => {
		expect(signersPronoun(['F', 'F', 'F'])).toBe('Nosotras');
		expect(signersPronoun(['F', 'M', 'F'])).toBe('Nosotros');
		expect(signersPronoun(['M'])).toBe('Nosotros');
		expect(signersPronoun([])).toBe('Nosotros');
	});
});

describe('residentGenderedWords', () => {
	it('returns every gendered word for template variables', () => {
		const words = residentGenderedWords('F');
		expect(words.citizen).toBe('ciudadana');
		expect(words.venezuelan).toBe('venezolana');
		expect(words.domiciled).toBe('domiciliada');
	});
});
