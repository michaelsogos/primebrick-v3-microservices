import { getEntityPersistenceMeta, type EntityClass } from "@primebrick/dal-pg";
import { ENTITY_REGISTRY } from "../domain/entities/registry.js";
import { type SchemaColumnMeta, type SchemaSnapshot, tableKey } from "./schema-types.js";

export function buildEntitySnapshot(generatedAt = new Date().toISOString()): SchemaSnapshot {
  const tables: SchemaSnapshot["tables"] = {};
  for (const ctor of ENTITY_REGISTRY) {
    const meta = getEntityPersistenceMeta(ctor as EntityClass, "emailsender");
    const key = tableKey(meta.tableSchema, meta.tableName);
    const columns: Record<string, SchemaColumnMeta> = {};
    let ord = 1;
    for (const [sqlName, c] of Object.entries(meta.columns)) {
      const hint = c.pgType ?? c.inferredPgType;
      const col: SchemaColumnMeta = {
        name: sqlName,
        ordinalPosition: ord++,
        dataType: hint,
        typname: hint,
        isPrimaryKey: c.isKey,
        isUnique: c.isUnique,
        isPostgresIdentity: c.usePostgresIdentity,
        propertyKey: c.propertyKey,
      };
      col.isNullable = c.nullable;
      if (c.defaultSql !== undefined) col.defaultSql = c.defaultSql;
      columns[sqlName] = col;
    }
    tables[key] = {
      kind: "table",
      schema: meta.tableSchema,
      name: meta.tableName,
      entityClassName: meta.entityClassName,
      isAuditable: meta.isAuditable,
      // @NotificationLog() was a US-local decorator with no DAL equivalent.
      // No entity in this microservice uses it; the communication-log table
      // is now modeled directly by SenderLogEntity. Kept as
      // `false` so the SchemaTableMeta shape stays compatible with the
      // patch-SQL generator (which has a dead branch for this flag).
      isNotificationLog: false,
      columns,
    };
  }
  return { version: 1, generatedAt, source: "entities", tables };
}
