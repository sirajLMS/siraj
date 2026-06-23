import { db, drizzleDbPool } from "../drizzleDb";
import { sql } from "drizzle-orm";
import { AppPermission } from "../../../shared/lib/enum";
import logger from "@/backend/lib/logger";

async function main() {
  const dbPerms = await db.execute(sql`
    SELECT key FROM permissions;
  `);
  
  const dbKeys = new Set(dbPerms.rows.map(r => r.key));
  const enumValues = new Set(Object.values(AppPermission));

  const missingInEnum = [...dbKeys].filter(k => !enumValues.has(k as string));
  const missingInDb = [...enumValues].filter(k => !dbKeys.has(k as string));

  logger.log("Keys in DB but missing in AppPermission Enum:", missingInEnum);
  logger.log("Keys in AppPermission Enum but missing in DB:", missingInDb);

  if (drizzleDbPool) {
    await drizzleDbPool.end();
  }
}

main().catch(logger.error);
