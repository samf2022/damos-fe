import { describe, expect, it } from 'vitest';
import { extractPlaceholders, findMissingPlaceholders, renderTemplate } from './renderTemplate';

const context = {
	resident: { fullName: 'Ana Pérez', nationalId: 'V-12.345.678', age: 30 },
	council: { name: 'Consejo Comunal Ejemplo' }
};

describe('renderTemplate', () => {
	it('replaces nested placeholders', () => {
		expect(
			renderTemplate(
				'{{council.name}} certifica que {{resident.fullName}}, C.I. {{resident.nationalId}}',
				context
			)
		).toBe('Consejo Comunal Ejemplo certifica que Ana Pérez, C.I. V-12.345.678');
	});

	it('tolerates whitespace and renders numbers', () => {
		expect(renderTemplate('{{ resident.age }} años', context)).toBe('30 años');
	});

	it('replaces repeated placeholders', () => {
		expect(renderTemplate('{{resident.fullName}} / {{resident.fullName}}', context)).toBe(
			'Ana Pérez / Ana Pérez'
		);
	});

	it('keeps unknown placeholders and objects visible', () => {
		expect(renderTemplate('Hola {{resident.phone}} {{resident}}', context)).toBe(
			'Hola {{resident.phone}} {{resident}}'
		);
	});

	it('does not resolve inherited properties', () => {
		expect(renderTemplate('{{resident.constructor}}', context)).toBe('{{resident.constructor}}');
	});
});

describe('placeholder inspection', () => {
	const template = '{{resident.fullName}} {{council.name}} {{resident.fullName}} {{x.y}}';

	it('extracts distinct placeholders', () => {
		expect(extractPlaceholders(template)).toEqual(['resident.fullName', 'council.name', 'x.y']);
	});

	it('finds placeholders missing from the context', () => {
		expect(findMissingPlaceholders(template, context)).toEqual(['x.y']);
	});
});
