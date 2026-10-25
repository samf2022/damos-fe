import { describe, expect, it } from 'vitest';
import type { ResidentSnapshot } from '#lib/types.ts';
import {
	buildCertificateContext,
	renderCertificateBody,
	residentAddress,
	type CertificateBodyInput
} from './renderCertificateBody';

const resident: ResidentSnapshot = {
	nationalId: 'V-12345678',
	firstNames: 'María José',
	lastNames: 'Pérez',
	gender: 'F',
	maritalStatus: 'single',
	occupation: null,
	streetAddress: 'Calle 5',
	houseNumber: '12',
	phone: '0412-1234567'
};

const base: CertificateBodyInput = {
	template:
		'{{signers.pronoun}}, integrantes del {{council.name}}, hacemos constar que {{resident.article}} {{resident.citizen}} {{resident.fullName}}, {{resident.nationality}}, {{resident.maritalStatus}}, C.I. {{resident.nationalId}}, {{resident.domiciled}} en {{resident.address}}, desde hace {{certificate.knownSince}}. Expedida en {{council.city}}, {{certificate.issuedOn}}.',
	council: {
		name: 'Consejo Comunal Ejemplo',
		state: 'Estado Ejemplo',
		municipality: 'Municipio Ejemplo',
		parish: 'Parroquia Ejemplo',
		sector_address: 'Sector Ejemplo',
		city: 'Ciudad Ejemplo'
	},
	resident,
	signerGenders: ['F', 'F'],
	knownSinceText: 'más de 20 años',
	issuedAt: '2026-07-13T15:00:00.000Z'
};

describe('renderCertificateBody', () => {
	it('renders a complete body with gender agreement', () => {
		const { body, missing } = renderCertificateBody(base);
		expect(missing).toEqual([]);
		expect(body).toBe(
			'Nosotras, integrantes del Consejo Comunal Ejemplo, hacemos constar que la ciudadana María José Pérez, venezolana, soltera, C.I. V-12345678, domiciliada en Calle 5, casa 12, desde hace más de 20 años. Expedida en Ciudad Ejemplo, a los trece días del mes de julio de dos mil veintiséis.'
		);
	});

	it('agrees with a male resident, mixed signers and the first day of the month', () => {
		const { body } = renderCertificateBody({
			...base,
			resident: { ...resident, gender: 'M', firstNames: 'José', maritalStatus: 'married' },
			signerGenders: ['F', 'M'],
			issuedAt: '2026-08-01T15:00:00.000Z'
		});
		expect(body).toContain('Nosotros,');
		expect(body).toContain('el ciudadano José Pérez, venezolano, casado');
		expect(body).toContain('domiciliado');
		expect(body).toContain('al primer día del mes de agosto');
	});

	it('uses "extranjero/a" for E- national ids', () => {
		const context = buildCertificateContext({
			...base,
			resident: { ...resident, nationalId: 'E-81234567' }
		});
		expect(context.resident.nationality).toBe('extranjera');
	});

	it('reports blank values that would leave gaps', () => {
		const { missing } = renderCertificateBody({
			...base,
			knownSinceText: '',
			resident: { ...resident, maritalStatus: null }
		});
		expect(missing).toEqual(['resident.maritalStatus', 'certificate.knownSince']);
	});
});

describe('residentAddress', () => {
	it('adds the house number when present', () => {
		expect(residentAddress({ streetAddress: 'Calle 5', houseNumber: null })).toBe('Calle 5');
		expect(residentAddress({ streetAddress: 'Calle 5', houseNumber: '12' })).toBe(
			'Calle 5, casa 12'
		);
	});
});
