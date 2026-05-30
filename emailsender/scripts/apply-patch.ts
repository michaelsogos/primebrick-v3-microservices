import "dotenv/config";
import { getPool } from "../src/db/pool.js";
import { readFileSync } from "fs";
import { join } from "path";

async function applyPatch(patchFilename: string) {
  const pool = getPool();
  try {
    const patchPath = join(process.cwd(), "db-meta", "patches", patchFilename);
    const patchSql = readFileSync(patchPath, "utf-8");
    
    // Execute the patch
    await pool.query(patchSql);
    console.log(`Applied patch: ${patchFilename}`);
    
    // Extract patch_id and content_sha256 from the patch file
    const patchIdMatch = patchSql.match(/-- patch_id: ([^\n]+)/);
    const shaMatch = patchSql.match(/-- content_sha256: ([^\n]+)/);
    
    if (patchIdMatch && shaMatch) {
      const patchId = patchIdMatch[1].trim();
      const contentSha256 = shaMatch[1].trim();
      
      // Register the patch in the backend's patch registry table
      await pool.query(
        "INSERT INTO public.primebrick_database_patch (patch_id, content_sha256) VALUES ($1, $2) ON CONFLICT (patch_id) DO NOTHING",
        [patchId, contentSha256]
      );
      console.log(`Registered patch in registry: ${patchId}`);
    }
  } catch (error) {
    console.error("Error applying patch:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Get patch filename from command line argument or use the latest
const patchFilename = process.argv[2] || "20260528114750_create_emailsender_email_config_emailsender_email_templates.sql";
applyPatch(patchFilename);
