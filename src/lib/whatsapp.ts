const VENEZUELA_COUNTRY_CODE = '58';

/**
 * Normalizes a Venezuelan phone number to the international format WhatsApp expects
 * (digits only, country code, no leading zero).
 *
 * `0412-1234567`, `(0412) 123 45 67`, `+58 412 1234567`, `00584121234567` and `4121234567`
 * all become `584121234567`. Returns `null` when the number can't be a Venezuelan phone.
 */
export function normalizeVenezuelanPhone(phone: string): string | null {
	let digits = phone.replace(/\D/g, '');
	if (digits.startsWith('00')) digits = digits.slice(2);

	let national: string;
	if (digits.startsWith(VENEZUELA_COUNTRY_CODE) && digits.length === 12) {
		national = digits.slice(2);
	} else if (digits.startsWith('0') && digits.length === 11) {
		national = digits.slice(1);
	} else if (digits.length === 10) {
		national = digits;
	} else {
		return null;
	}

	// National numbers are 10 digits: mobile (4xx) or landline (2xx).
	if (!/^[24]\d{9}$/.test(national)) return null;
	return VENEZUELA_COUNTRY_CODE + national;
}

/** Builds a `wa.me` click-to-chat link, or `null` if the phone number is invalid. */
export function buildWhatsAppLink(phone: string, message: string): string | null {
	const normalized = normalizeVenezuelanPhone(phone);
	if (!normalized) return null;
	const base = `https://wa.me/${normalized}`;
	// encodeURIComponent uses %20 for spaces, which is what WhatsApp documents.
	return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
