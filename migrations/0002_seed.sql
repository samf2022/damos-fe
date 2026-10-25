-- Sample data for development. All people and data below are FICTITIOUS.
-- Update council_settings and signers from the admin panel before issuing real certificates.

INSERT INTO council_settings (
	id, name, tax_id, state, municipality, parish, sector_address, city, logo_r2_key, validity_months, validity_note
) VALUES (
	'00000000-0000-4000-8000-000000000001',
	'Consejo Comunal Ejemplo',
	'C-00000000-0',
	'Estado Ejemplo',
	'Municipio Ejemplo',
	'Parroquia Ejemplo',
	'Sector Ejemplo, Calle Principal',
	'Ciudad Ejemplo',
	NULL,
	6,
	'Esta constancia tiene una vigencia de seis (6) meses a partir de su emisión.'
);

INSERT INTO certificate_types (id, code, title, body_template) VALUES
(
	'00000000-0000-4000-8000-000000000101',
	'residence',
	'Constancia de Residencia',
	'{{signers.pronoun}}, integrantes del {{council.name}}, por medio de la presente hacemos constar que {{resident.article}} {{resident.citizen}} {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}, titular de la cédula de identidad N.º {{resident.nationalId}}, se encuentra {{resident.domiciled}} en {{resident.address}}, {{council.sectorAddress}}, Parroquia {{council.parish}}, Municipio {{council.municipality}}, {{council.state}}, desde hace {{certificate.knownSince}}.

Constancia que se expide a petición de la parte interesada en {{council.city}}, a los {{certificate.issuedAtWords}}.'
),
(
	'00000000-0000-4000-8000-000000000102',
	'residence_conduct',
	'Constancia de Residencia y Buena Conducta',
	'{{signers.pronoun}}, integrantes del {{council.name}}, por medio de la presente hacemos constar que {{resident.article}} {{resident.citizen}} {{resident.fullName}}, {{resident.nationality}}, mayor de edad, {{resident.maritalStatus}}, titular de la cédula de identidad N.º {{resident.nationalId}}, se encuentra {{resident.domiciled}} en {{resident.address}}, {{council.sectorAddress}}, Parroquia {{council.parish}}, Municipio {{council.municipality}}, {{council.state}}, desde hace {{certificate.knownSince}}, y que durante ese tiempo ha observado buena conducta y respeto hacia la comunidad.

Constancia que se expide a petición de la parte interesada en {{council.city}}, a los {{certificate.issuedAtWords}}.'
),
(
	'00000000-0000-4000-8000-000000000103',
	'conduct',
	'Constancia de Buena Conducta',
	'{{signers.pronoun}}, integrantes del {{council.name}}, por medio de la presente hacemos constar que conocemos de vista, trato y comunicación desde hace {{certificate.knownSince}} a {{resident.article}} {{resident.citizen}} {{resident.fullName}}, {{resident.nationality}}, mayor de edad, titular de la cédula de identidad N.º {{resident.nationalId}}, y que durante ese tiempo ha observado buena conducta y respeto hacia la comunidad.

Constancia que se expide a petición de la parte interesada en {{council.city}}, a los {{certificate.issuedAtWords}}.'
);

INSERT INTO signers (id, full_name, short_name, national_id, role_title, phone, gender, is_active, display_order) VALUES
('00000000-0000-4000-8000-000000000201', 'María Fernanda Ejemplo Prueba', 'María Ejemplo', 'V-00000001', 'Voc. Finanzas', '0412-0000001', 'F', 1, 1),
('00000000-0000-4000-8000-000000000202', 'José Luis Ficticio Demo', 'José Ficticio', 'V-00000002', 'Voc. Contraloría', '0414-0000002', 'M', 1, 2),
('00000000-0000-4000-8000-000000000203', 'Ana Carolina Muestra Test', 'Ana Muestra', 'V-00000003', 'Voc. Unidad Ejecutiva', '0424-0000003', 'F', 1, 3);

INSERT INTO certificate_type_signers (certificate_type_id, signer_id, display_order)
SELECT ct.id, s.id, s.display_order
FROM certificate_types ct
CROSS JOIN signers s;
