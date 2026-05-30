import "dotenv/config";
import { buildDatabaseSnapshot } from "../src/db/build-database-snapshot.js";
import { writeFileSync } from "fs";
import { join } from "path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const tables = [
  { schema: "emailsender", name: "email_config" },
  { schema: "emailsender", name: "email_templates" },
];

const snapshot = await buildDatabaseSnapshot(databaseUrl, tables);
const snapshotPath = join(process.cwd(), "db-meta", "snapshot-database.json");
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
console.log(`Database snapshot written to ${snapshotPath}`);
