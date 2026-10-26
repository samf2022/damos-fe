import { describe, expect, it } from 'vitest';
import { isInForce } from './inForce';

const NOW = new Date('2026-10-26T12:00:00.000Z');

describe('isInForce', () => {
	it('is true only for approved certificates that have not expired', () => {
		expect(isInForce({ status: 'approved', expires_at: '2027-01-01T00:00:00.000Z' }, NOW)).toBe(
			true
		);
		expect(isInForce({ status: 'approved', expires_at: '2026-10-01T00:00:00.000Z' }, NOW)).toBe(
			false
		);
		expect(isInForce({ status: 'approved', expires_at: null }, NOW)).toBe(false);
		expect(isInForce({ status: 'pending', expires_at: '2027-01-01T00:00:00.000Z' }, NOW)).toBe(
			false
		);
	});
});
