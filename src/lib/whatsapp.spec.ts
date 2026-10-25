import { describe, expect, it } from 'vitest';
import { buildWhatsAppLink, normalizeVenezuelanPhone } from './whatsapp';

describe('normalizeVenezuelanPhone', () => {
	it.each([
		['0412-1234567', '584121234567'],
		['0414 123 45 67', '584141234567'],
		['(0424) 123-4567', '584241234567'],
		['+58 416 1234567', '584161234567'],
		['+58-426-123-45-67', '584261234567'],
		['00584121234567', '584121234567'],
		['584121234567', '584121234567'],
		['4121234567', '584121234567'],
		['0212-5551234', '582125551234']
	])('%s → %s', (input, expected) => {
		expect(normalizeVenezuelanPhone(input)).toBe(expected);
	});

	it.each(['', '1234', '0412-123456', '0412-12345678', '0512-1234567', '+1 305 555 1234'])(
		'rejects %j',
		(input) => {
			expect(normalizeVenezuelanPhone(input)).toBeNull();
		}
	);
});

describe('buildWhatsAppLink', () => {
	it('builds a wa.me link with an encoded message', () => {
		expect(
			buildWhatsAppLink('0412-1234567', 'Hola, su constancia N.º 12 está lista & firmada')
		).toBe(
			'https://wa.me/584121234567?text=Hola%2C%20su%20constancia%20N.%C2%BA%2012%20est%C3%A1%20lista%20%26%20firmada'
		);
	});

	it('omits the text parameter for empty messages', () => {
		expect(buildWhatsAppLink('0412-1234567', '')).toBe('https://wa.me/584121234567');
	});

	it('returns null for invalid numbers', () => {
		expect(buildWhatsAppLink('123', 'Hola')).toBeNull();
	});
});
