-- Primebrick: i18n for the `job.partition_maintenance` callable — the
-- census label/description shown when this system job appears in the
-- callables surface. The callable is SDK-mounted (createMicroservice
-- `partitionMaintenance`); its label keys ride the same translation
-- table as every job.* key.

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.callable.partition_maintenance.label', 'en-GB', 'Partition maintenance', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.label', 'en-US', 'Partition maintenance', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.label', 'it-IT', 'Manutenzione partizioni', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.label', 'de-DE', 'Partitionswartung', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.label', 'es-ES', 'Mantenimiento de particiones', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.label', 'fr-FR', 'Maintenance des partitions', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.label', 'pt-PT', 'Manutenção de partições', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),

  (uuidv7(), 'job.callable.partition_maintenance.desc', 'en-GB', 'Drops expired audit and entity partitions and sweeps rows past their declared retention. Takes no parameters.', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.desc', 'en-US', 'Drops expired audit and entity partitions and sweeps rows past their declared retention. Takes no parameters.', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.desc', 'it-IT', 'Elimina le partizioni audit ed entità scadute e cancella le righe oltre la retention dichiarata. Non richiede parametri.', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.desc', 'de-DE', 'Löscht abgelaufene Audit- und Entitätspartitionen und entfernt Zeilen jenseits ihrer deklarierten Aufbewahrung. Erfordert keine Parameter.', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.desc', 'es-ES', 'Elimina las particiones de auditoría y entidad vencidas y borra las filas más allá de su retención declarada. No requiere parámetros.', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.desc', 'fr-FR', 'Supprime les partitions d''audit et d''entité expirées et balaie les lignes au-delà de leur rétention déclarée. Ne prend aucun paramètre.', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1),
  (uuidv7(), 'job.callable.partition_maintenance.desc', 'pt-PT', 'Elimina as partições de auditoria e entidade expiradas e remove as linhas além da sua retenção declarada. Não requer parâmetros.', now(), 'migration-partition-callable', now(), 'migration-partition-callable', 1);
