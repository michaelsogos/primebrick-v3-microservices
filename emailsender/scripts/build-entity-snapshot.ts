import { buildEntitySnapshot } from "../src/db/build-entity-snapshot.js";
import { writeFileSync } from "fs";
import { join } from "path";

const snapshot = buildEntitySnapshot();
const snapshotPath = join(process.cwd(), "db-meta", "snapshot-entities.json");
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
console.log(`Entity snapshot written to ${snapshotPath}`);
