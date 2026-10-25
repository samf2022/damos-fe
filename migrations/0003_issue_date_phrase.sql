-- "a los {{certificate.issuedAtWords}}" reads "a los primer día…" on the 1st of the month.
-- {{certificate.issuedOn}} already includes the right preposition ("a los trece días…" / "al primer día…").
UPDATE certificate_types
SET body_template = replace(body_template, 'a los {{certificate.issuedAtWords}}', '{{certificate.issuedOn}}'),
	updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE body_template LIKE '%a los {{certificate.issuedAtWords}}%';
