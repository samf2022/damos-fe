// Fictitious people for previews of certificate templates.
import type { Gender, ResidentSnapshot } from '#lib/types.ts';
import type { SignerForTemplate } from './renderCertificateBody.ts';

export const SAMPLE_RESIDENTS: Record<Gender, ResidentSnapshot> = {
	F: {
		nationalId: 'V-12345678',
		firstNames: 'María Fernanda',
		lastNames: 'Pérez Gómez',
		gender: 'F',
		maritalStatus: 'single',
		occupation: 'costurera',
		streetAddress: 'calle Los Pinos',
		houseNumber: '14',
		phone: null
	},
	M: {
		nationalId: 'V-23456789',
		firstNames: 'José Luis',
		lastNames: 'Rodríguez Díaz',
		gender: 'M',
		maritalStatus: 'married',
		occupation: 'comerciante',
		streetAddress: 'calle Los Pinos',
		houseNumber: '7',
		phone: null
	}
};

export const SAMPLE_KNOWN_SINCE = 'más de 20 años';

/** Used when there are fewer than two active signers. */
export const SAMPLE_SIGNERS = [
	{
		fullName: 'Ana Ejemplo Muestra',
		nationalId: 'V-1000001',
		gender: 'F',
		shortName: 'Ana Ejemplo',
		roleTitle: 'Voc. Finanzas',
		phone: null
	},
	{
		fullName: 'Carmen Prueba Demo',
		nationalId: 'V-1000002',
		gender: 'F',
		shortName: 'Carmen Prueba',
		roleTitle: 'Voc. Contraloría Social',
		phone: null
	}
] satisfies (SignerForTemplate & { shortName: string; roleTitle: string; phone: null })[];
