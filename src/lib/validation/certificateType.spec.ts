import { describe, expect, it } from 'vitest';
import { findTemplateProblems, validateCertificateType } from './certificateType';

const BODY = 'Hacemos constar que {{resident.toCitizen}}, {{resident.fullName}}, reside aquí.';

function form(fields: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.append(key, value);
	return data;
}

describe('findTemplateProblems', () => {
	it('accepts known placeholders, with or without inner spaces', () => {
		expect(findTemplateProblems('{{ resident.fullName }} y {{council.name}}')).toEqual({
			unknown: [],
			missingRequired: [],
			strayBraces: false
		});
	});

	it('reports typos, the missing resident name and stray braces', () => {
		expect(findTemplateProblems('{{resident.fulName}} vive en {council.name}}')).toEqual({
			unknown: ['resident.fulName'],
			missingRequired: ['resident.fullName'],
			strayBraces: true
		});
		expect(findTemplateProblems('{{resident.fullName}} {{resident.address').strayBraces).toBe(true);
	});
});

describe('validateCertificateType', () => {
	it('returns clean data, joining the body into one paragraph', () => {
		const result = validateCertificateType(
			form({
				title: '  Constancia  de Prueba ',
				body_template: `${BODY}\n\n  Fin.`,
				is_active: 'on'
			})
		);
		expect(result).toEqual({
			ok: true,
			data: { title: 'Constancia de Prueba', bodyTemplate: `${BODY} Fin.`, isActive: true }
		});
	});

	it('treats an unchecked box as inactive', () => {
		const result = validateCertificateType(form({ title: 'Constancia', body_template: BODY }));
		expect(result.ok && result.data.isActive).toBe(false);
	});

	it('reports required fields and long texts', () => {
		const result = validateCertificateType(
			form({ title: '', body_template: `{{resident.fullName}} ${'a'.repeat(4000)}` })
		);
		expect(result).toMatchObject({
			ok: false,
			errors: { title: 'required', body_template: 'too_long' },
			problems: null
		});
	});

	it('rejects a body with template problems and keeps what was typed', () => {
		const result = validateCertificateType(
			form({ title: 'Constancia', body_template: 'Sin nombre {{consejo.nombre}}', is_active: 'on' })
		);
		expect(result).toEqual({
			ok: false,
			errors: {},
			problems: {
				unknown: ['consejo.nombre'],
				missingRequired: ['resident.fullName'],
				strayBraces: false
			},
			values: {
				title: 'Constancia',
				body_template: 'Sin nombre {{consejo.nombre}}',
				is_active: true
			}
		});
	});
});
