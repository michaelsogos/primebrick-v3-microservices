-- `language_iso` normalized to BCP-47 — the send contract now declares
-- `languageIso` as a BCP-47 tag (e.g. it-IT, en-US); existing template
-- variants stored as bare ISO 639-1 are mapped deterministically.
UPDATE emailsender.email_templates SET language_iso = 'en-US' WHERE language_iso = 'en';
UPDATE emailsender.email_templates SET language_iso = 'it-IT' WHERE language_iso = 'it';
