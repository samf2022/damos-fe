-- Certificate texts modeled on the council's paper certificates. Council data, signers and
-- resident data come from placeholders (see CertificateTemplateContext), so no names or
-- places are hard-coded here. The text is plural: it needs at least two signers.

UPDATE certificate_types
SET title = 'Constancia de Residencia',
	body_template = '{{signers.pronoun}}, {{signers.names}}, {{signers.nationality}}, mayores de edad, hábiles en derecho, titulares de las Cédulas de Identidad Nº {{signers.nationalIds}}, respectivamente, {{signers.domiciled}} en {{council.sectorAddress}}, parroquia {{council.parish}}, municipio {{council.municipality}} del estado {{council.state}}; en nuestra condición de {{signers.spokespersons}} del {{council.name}}, hacemos constar que conocemos de vista, trato y comunicación desde hace {{certificate.knownSince}}, {{resident.toCitizen}} {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}{{resident.occupationPart}}, hábil en derecho, titular de la Cédula de Identidad Nº {{resident.nationalIdNumber}}, {{resident.domiciled}} en {{resident.address}} de nuestro sector. Constancia que expedimos a solicitud de parte interesada en {{council.city}}, {{certificate.issuedOn}}. ({{certificate.issuedDate}}).',
	updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE code = 'residence';

UPDATE certificate_types
SET title = 'Constancia de Residencia y Conducta',
	body_template = '{{signers.pronoun}}, {{signers.names}}, {{signers.nationality}}, mayores de edad, hábiles en derecho, titulares de las Cédulas de Identidad Nº {{signers.nationalIds}}, respectivamente, {{signers.domiciled}} en {{council.sectorAddress}}, parroquia {{council.parish}}, municipio {{council.municipality}} del estado {{council.state}}; en nuestra condición de {{signers.spokespersons}} del {{council.name}}, hacemos constar que conocemos de vista, trato y comunicación desde hace {{certificate.knownSince}}, {{resident.toCitizen}} {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}{{resident.occupationPart}}, titular de la Cédula de Identidad Nº {{resident.nationalIdNumber}}, {{resident.domiciled}} en {{resident.address}} del citado sector y por el conocimiento que {{resident.ofThem}} tenemos damos fe que es {{resident.aCitizen}} de BUENA CONDUCTA. Constancia que expedimos a solicitud de parte interesada en {{council.city}}, {{certificate.issuedOn}}. ({{certificate.issuedDate}}).',
	updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE code = 'residence_conduct';

-- No paper sample for this one: same wording as residence_conduct without certifying the address.
UPDATE certificate_types
SET title = 'Constancia de Buena Conducta',
	body_template = '{{signers.pronoun}}, {{signers.names}}, {{signers.nationality}}, mayores de edad, hábiles en derecho, titulares de las Cédulas de Identidad Nº {{signers.nationalIds}}, respectivamente, {{signers.domiciled}} en {{council.sectorAddress}}, parroquia {{council.parish}}, municipio {{council.municipality}} del estado {{council.state}}; en nuestra condición de {{signers.spokespersons}} del {{council.name}}, hacemos constar que conocemos de vista, trato y comunicación desde hace {{certificate.knownSince}}, {{resident.toCitizen}} {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}{{resident.occupationPart}}, titular de la Cédula de Identidad Nº {{resident.nationalIdNumber}}, y por el conocimiento que {{resident.ofThem}} tenemos damos fe que es {{resident.aCitizen}} de BUENA CONDUCTA. Constancia que expedimos a solicitud de parte interesada en {{council.city}}, {{certificate.issuedOn}}. ({{certificate.issuedDate}}).',
	updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE code = 'conduct';

-- The note printed under the signatures, as on paper (only if still the sample text).
UPDATE council_settings
SET validity_note = 'La presente tendrá vigencia por seis (6) meses a partir de esta fecha.',
	updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE validity_note = 'Esta constancia tiene una vigencia de seis (6) meses a partir de su emisión.';
