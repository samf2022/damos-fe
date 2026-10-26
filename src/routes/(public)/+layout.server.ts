import { getAppUrl, getDb } from '#lib/server/bindings.ts';
import type { CouncilSettingsRow } from '#lib/server/db.ts';
import type { LayoutServerLoad } from './$types';

/** Council identity shown on every public page (header, footer, link previews). */
export const load: LayoutServerLoad = async () => {
	const council = await getDb().first<
		Pick<
			CouncilSettingsRow,
			'name' | 'tax_id' | 'parish' | 'municipality' | 'state' | 'logo_r2_key' | 'validity_months'
		>
	>(
		`SELECT name, tax_id, parish, municipality, state, logo_r2_key, validity_months
		   FROM council_settings LIMIT 1`
	);
	const logoPath = council?.logo_r2_key ? `/api/files/${council.logo_r2_key}` : null;
	return {
		council: council && {
			name: council.name,
			taxId: council.tax_id,
			place: `${council.parish}, ${council.municipality}, ${council.state}`,
			validityMonths: council.validity_months,
			logoPath
		},
		/** Absolute, for Open Graph previews (WhatsApp shows them when the link is shared). */
		logoUrl: logoPath ? new URL(logoPath, getAppUrl()).toString() : null
	};
};
