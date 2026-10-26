import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findTemplateProblems } from '#lib/validation/certificateType.ts';
import type { TemplateContext } from '#lib/text/renderTemplate.ts';
import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { buildCertificateContext } from './renderCertificateBody';
import { SAMPLE_KNOWN_SINCE, SAMPLE_RESIDENTS, SAMPLE_SIGNERS } from './sampleData';
import { TEMPLATE_PLACEHOLDERS } from './templatePlaceholders';

function paths(context: TemplateContext, prefix = ''): string[] {
	return Object.entries(context).flatMap(([key, value]) =>
		value !== null && typeof value === 'object'
			? paths(value, `${prefix}${key}.`)
			: [`${prefix}${key}`]
	);
}

describe('TEMPLATE_PLACEHOLDERS', () => {
	it('lists exactly the variables the renderer provides', () => {
		const context = buildCertificateContext({
			template: '',
			council: {
				name: 'Consejo Comunal “Los Pinos”',
				state: 'Sucre',
				municipality: 'Bermúdez',
				parish: 'Santa Catalina',
				sector_address: 'el Sector “Los Pinos”',
				city: 'Carúpano'
			},
			resident: SAMPLE_RESIDENTS.F,
			signers: SAMPLE_SIGNERS,
			knownSinceText: SAMPLE_KNOWN_SINCE,
			issuedAt: '2026-10-26T15:00:00.000Z'
		});
		expect([...TEMPLATE_PLACEHOLDERS].sort()).toEqual(paths(context).sort());
	});
});

describe('DEFAULT_TEMPLATES', () => {
	it('matches the wording installed by migration 0004', () => {
		const sql = readFileSync('migrations/0004_real_templates.sql', 'utf8');
		const fromSql = Object.fromEntries(
			[
				...sql.matchAll(
					/SET title = '((?:[^']|'')+)',\s*body_template = '((?:[^']|'')+)'[\s\S]*?WHERE code = '(\w+)'/g
				)
			].map(([, title, body, code]) => [
				code,
				{ title: title.replaceAll("''", "'"), body: body.replaceAll("''", "'") }
			])
		);
		expect(fromSql).toEqual(DEFAULT_TEMPLATES);
	});

	it('only uses known placeholders', () => {
		for (const { body } of Object.values(DEFAULT_TEMPLATES)) {
			expect(findTemplateProblems(body)).toEqual({
				unknown: [],
				missingRequired: [],
				strayBraces: false
			});
		}
	});
});
