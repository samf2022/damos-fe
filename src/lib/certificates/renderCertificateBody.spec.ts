import { beforeAll, describe, expect, it } from 'vitest';
import { createDb } from '#lib/server/db.ts';
import { createMemoryD1 } from '#lib/server/testing/memoryD1.ts';
import type { CertificateTypeCode, ResidentSnapshot } from '#lib/types.ts';
import {
	buildCertificateContext,
	renderCertificateBody,
	residentAddress,
	type CertificateBodyInput
} from './renderCertificateBody';

// All people and places below are fictitious.
const resident: ResidentSnapshot = {
	nationalId: 'V-12345678',
	firstNames: 'María José',
	lastNames: 'Pérez Cedeño',
	gender: 'F',
	maritalStatus: 'single',
	occupation: 'Costurera',
	streetAddress: 'calle Los Pinos',
	houseNumber: '05',
	phone: '0412-1234567'
};

const council = {
	name: 'Consejo Comunal “Los Pinos”',
	state: 'Sucre',
	municipality: 'Bermúdez',
	parish: 'Santa Catalina',
	sector_address: 'el Sector “Los Pinos”, vía principal',
	city: 'Carúpano'
};

const signers = [
	{ fullName: 'Ana Luisa Gómez', nationalId: 'V-16842708', gender: 'F' as const },
	{ fullName: 'Carmen Rosa Díaz', nationalId: 'V-4935094', gender: 'F' as const }
];

let templates: Record<CertificateTypeCode, string>;
beforeAll(async () => {
	const db = createDb(createMemoryD1({ seed: true }));
	const rows = await db.all<{ code: CertificateTypeCode; body_template: string }>(
		'SELECT code, body_template FROM certificate_types'
	);
	templates = Object.fromEntries(rows.map((r) => [r.code, r.body_template])) as typeof templates;
});

const input = (overrides: Partial<CertificateBodyInput> = {}): CertificateBodyInput => ({
	template: templates.residence,
	council,
	resident,
	signers,
	knownSinceText: 'más de 20 años',
	issuedAt: '2026-07-13T15:00:00.000Z',
	...overrides
});

describe('renderCertificateBody with the real templates', () => {
	it('renders the residence certificate like the paper version', () => {
		const { body, missing } = renderCertificateBody(input());
		expect(missing).toEqual([]);
		expect(body).toBe(
			'Nosotras, ANA LUISA GÓMEZ y CARMEN ROSA DÍAZ, venezolanas, mayores de edad, hábiles en derecho, titulares de las Cédulas de Identidad Nº 16.842.708 y 4.935.094, respectivamente, domiciliadas en el Sector “Los Pinos”, vía principal, parroquia Santa Catalina, municipio Bermúdez del estado Sucre; en nuestra condición de Voceras del Consejo Comunal “Los Pinos”, hacemos constar que conocemos de vista, trato y comunicación desde hace más de 20 años, a la ciudadana, MARÍA JOSÉ PÉREZ CEDEÑO, venezolana, mayor de edad, soltera, costurera, hábil en derecho, titular de la Cédula de Identidad Nº 12.345.678, domiciliada en calle Los Pinos, casa N° 05 de nuestro sector. Constancia que expedimos a solicitud de parte interesada en Carúpano, a los trece días del mes de julio de dos mil veintiséis. (13-07-2026).'
		);
	});

	it('adds the good-conduct statement with gender agreement', () => {
		const { body } = renderCertificateBody(
			input({
				template: templates.residence_conduct,
				resident: { ...resident, gender: 'M', firstNames: 'José', maritalStatus: 'married' },
				signers: [...signers, { fullName: 'Luis Ríos', nationalId: 'V-5880762', gender: 'M' }]
			})
		);
		expect(body).toMatch(/^Nosotros, ANA LUISA GÓMEZ, CARMEN ROSA DÍAZ y LUIS RÍOS, venezolanos,/);
		expect(body).toContain('16.842.708, 4.935.094 y 5.880.762, respectivamente, domiciliados');
		expect(body).toContain('condición de Voceros');
		expect(body).toContain('al ciudadano, JOSÉ PÉREZ CEDEÑO, venezolano, mayor de edad, casado');
		expect(body).toContain(
			'del citado sector y por el conocimiento que de él tenemos damos fe que es un ciudadano de BUENA CONDUCTA.'
		);
	});

	it('conduct-only mentions the address, as the residence-and-conduct paper does', () => {
		const { body, missing } = renderCertificateBody(input({ template: templates.conduct }));
		expect(missing).toEqual([]);
		expect(body).toContain(
			'Nº 12.345.678, domiciliada en calle Los Pinos, casa N° 05 de nuestro sector, y por el conocimiento'
		);
		expect(body).toContain('que de ella tenemos damos fe que es una ciudadana de BUENA CONDUCTA');
	});

	it('omits the occupation when unknown and uses "al primer día"', () => {
		const { body, missing } = renderCertificateBody(
			input({ resident: { ...resident, occupation: null }, issuedAt: '2026-08-01T15:00:00.000Z' })
		);
		expect(missing).toEqual([]);
		expect(body).toContain('mayor de edad, soltera, hábil en derecho');
		expect(body).toContain('al primer día del mes de agosto de dos mil veintiséis. (01-08-2026).');
	});

	it('uses "extranjero/a" for E- national ids', () => {
		const context = buildCertificateContext(
			input({ resident: { ...resident, nationalId: 'E-81234567' } })
		);
		expect(context.resident.nationality).toBe('extranjera');
		expect(context.resident.nationalIdNumber).toBe('E-81.234.567');
	});

	it('completes a bare number of years', () => {
		expect(buildCertificateContext(input({ knownSinceText: ' 20 ' })).certificate.knownSince).toBe(
			'20 años'
		);
		expect(buildCertificateContext(input({ knownSinceText: '1' })).certificate.knownSince).toBe(
			'1 año'
		);
		expect(
			buildCertificateContext(input({ knownSinceText: 'varios años' })).certificate.knownSince
		).toBe('varios años');
	});

	it('reports blank required values', () => {
		const { missing } = renderCertificateBody(
			input({ knownSinceText: '', resident: { ...resident, maritalStatus: null } })
		);
		expect(missing).toEqual(['certificate.knownSince', 'resident.maritalStatus']);
	});
});

describe('residentAddress', () => {
	it('adds the house number when present', () => {
		expect(residentAddress({ streetAddress: 'calle 5', houseNumber: null })).toBe('calle 5');
		expect(residentAddress({ streetAddress: 'calle 5', houseNumber: '12' })).toBe(
			'calle 5, casa N° 12'
		);
	});
});
