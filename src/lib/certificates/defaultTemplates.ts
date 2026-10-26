// Original wording of each certificate type (same as migrations/0004_real_templates.sql),
// offered in the editor to undo changes. A test keeps both in sync.
import type { CertificateTypeCode } from '#lib/types.ts';

export const DEFAULT_TEMPLATES: Record<CertificateTypeCode, { title: string; body: string }> = {
	residence: {
		title: 'Constancia de Residencia',
		body: '{{signers.pronoun}}, {{signers.names}}, {{signers.nationality}}, mayores de edad, hábiles en derecho, titulares de las Cédulas de Identidad Nº {{signers.nationalIds}}, respectivamente, {{signers.domiciled}} en {{council.sectorAddress}}, parroquia {{council.parish}}, municipio {{council.municipality}} del estado {{council.state}}; en nuestra condición de {{signers.spokespersons}} del {{council.name}}, hacemos constar que conocemos de vista, trato y comunicación desde hace {{certificate.knownSince}}, {{resident.toCitizen}}, {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}{{resident.occupationPart}}, hábil en derecho, titular de la Cédula de Identidad Nº {{resident.nationalIdNumber}}, {{resident.domiciled}} en {{resident.address}} de nuestro sector. Constancia que expedimos a solicitud de parte interesada en {{council.city}}, {{certificate.issuedOn}}. ({{certificate.issuedDate}}).'
	},
	residence_conduct: {
		title: 'Constancia de Residencia y Conducta',
		body: '{{signers.pronoun}}, {{signers.names}}, {{signers.nationality}}, mayores de edad, hábiles en derecho, titulares de las Cédulas de Identidad Nº {{signers.nationalIds}}, respectivamente, {{signers.domiciled}} en {{council.sectorAddress}}, parroquia {{council.parish}}, municipio {{council.municipality}} del estado {{council.state}}; en nuestra condición de {{signers.spokespersons}} del {{council.name}}, hacemos constar que conocemos de vista, trato y comunicación desde hace {{certificate.knownSince}}, {{resident.toCitizen}}, {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}{{resident.occupationPart}}, titular de la Cédula de Identidad Nº {{resident.nationalIdNumber}}, {{resident.domiciled}} en {{resident.address}} del citado sector y por el conocimiento que {{resident.ofThem}} tenemos damos fe que es {{resident.aCitizen}} de BUENA CONDUCTA. Constancia que expedimos a solicitud de parte interesada en {{council.city}}, {{certificate.issuedOn}}. ({{certificate.issuedDate}}).'
	},
	conduct: {
		title: 'Constancia de Buena Conducta',
		body: '{{signers.pronoun}}, {{signers.names}}, {{signers.nationality}}, mayores de edad, hábiles en derecho, titulares de las Cédulas de Identidad Nº {{signers.nationalIds}}, respectivamente, {{signers.domiciled}} en {{council.sectorAddress}}, parroquia {{council.parish}}, municipio {{council.municipality}} del estado {{council.state}}; en nuestra condición de {{signers.spokespersons}} del {{council.name}}, hacemos constar que conocemos de vista, trato y comunicación desde hace {{certificate.knownSince}}, {{resident.toCitizen}}, {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}{{resident.occupationPart}}, titular de la Cédula de Identidad Nº {{resident.nationalIdNumber}}, {{resident.domiciled}} en {{resident.address}} de nuestro sector, y por el conocimiento que {{resident.ofThem}} tenemos damos fe que es {{resident.aCitizen}} de BUENA CONDUCTA. Constancia que expedimos a solicitud de parte interesada en {{council.city}}, {{certificate.issuedOn}}. ({{certificate.issuedDate}}).'
	}
};
