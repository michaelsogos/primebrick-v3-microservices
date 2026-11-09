-- i18n key snake_case cleanup — ai own-schema renames + CHECK
-- tx:
-- === ai.translations renames ===
UPDATE ai.translations SET "key" = 'ai.docs.col.content_size' WHERE "key" = 'ai.docs.col.contentSize';
UPDATE ai.translations SET "key" = 'ai.docs.col.expected_chunks' WHERE "key" = 'ai.docs.col.expectedChunks';
UPDATE ai.translations SET "key" = 'ai.docs.col.expected_docs' WHERE "key" = 'ai.docs.col.expectedDocs';
UPDATE ai.translations SET "key" = 'ai.docs.col.vector_size' WHERE "key" = 'ai.docs.col.vectorSize';
UPDATE ai.translations SET "key" = 'ai.docs.drift_detected' WHERE "key" = 'ai.docs.driftDetected';
UPDATE ai.translations SET "key" = 'ai.docs.load_failed' WHERE "key" = 'ai.docs.loadFailed';
UPDATE ai.translations SET "key" = 'ai.docs.pack_error' WHERE "key" = 'ai.docs.packError';
UPDATE ai.translations SET "key" = 'ai.docs.probes_hint' WHERE "key" = 'ai.docs.probesHint';
UPDATE ai.translations SET "key" = 'ai.docs.reindex_all' WHERE "key" = 'ai.docs.reindexAll';
UPDATE ai.translations SET "key" = 'ai.docs.reindex_done' WHERE "key" = 'ai.docs.reindexDone';
UPDATE ai.translations SET "key" = 'ai.docs.reindex_failed' WHERE "key" = 'ai.docs.reindexFailed';
UPDATE ai.translations SET "key" = 'ai.docs.run_probes' WHERE "key" = 'ai.docs.runProbes';
UPDATE ai.translations SET "key" = 'ai.entities.ai_model.compatibility.compatible' WHERE "key" = 'ai.entities.ai_model.compatibility.COMPATIBLE';
UPDATE ai.translations SET "key" = 'ai.entities.ai_model.compatibility.not_compatible' WHERE "key" = 'ai.entities.ai_model.compatibility.NOT_COMPATIBLE';
ALTER TABLE ai.translations ADD CONSTRAINT translations_key_shape CHECK ("key" ~ '^ai(\.[a-z0-9_]+)+$');
-- /tx
