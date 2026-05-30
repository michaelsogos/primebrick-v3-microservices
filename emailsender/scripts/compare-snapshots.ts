import "dotenv/config";
import { compareSnapshots } from "../src/db/schema-snapshot.js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const entitySnapPath = join(process.cwd(), "db-meta", "snapshot-entities.json");
const dbSnapPath = join(process.cwd(), "db-meta", "snapshot-database.json");
const diffPath = join(process.cwd(), "db-meta", "diff-entities-vs-database.json");

const entitySnap = JSON.parse(readFileSync(entitySnapPath, "utf-8"));
const dbSnap = JSON.parse(readFileSync(dbSnapPath, "utf-8"));

const diff = compareSnapshots(entitySnap, dbSnap);
writeFileSync(diffPath, JSON.stringify(diff, null, 2));
console.log(`Diff written to ${diffPath}`);
