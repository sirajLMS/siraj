import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "@/backend/db";
import { groupPermissions, permissionGroups, permissions, systemSettings, timezones } from "@/backend/db/schema";

function escapeSql(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
}

export async function exportSystemDataToSqlite(): Promise<void> {
  const perms = await db.select().from(permissions).orderBy(permissions.key);
  const groups = await db.select().from(permissionGroups).orderBy(permissionGroups.slug);
  const gp = await db.select().from(groupPermissions);
  const tz = await db.select().from(timezones).orderBy(timezones.ianaId);
  const ss = await db.select().from(systemSettings).orderBy(systemSettings.key);

  const statements: string[] = [];

  // Permissions
  for (const p of perms) {
    statements.push(
      `INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES (${escapeSql(p.id)}, ${escapeSql(p.key)}, ${escapeSql(p.resource)}, ${escapeSql(p.action)}, ${escapeSql(p.description)}, ${escapeSql(p.category)}, ${escapeSql(p.isSystem)});`
    );
  }

  // Groups
  for (const g of groups) {
    statements.push(
      `INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES (${escapeSql(g.id)}, ${escapeSql(g.name)}, ${escapeSql(g.description)}, ${escapeSql(g.isSystem)}, ${escapeSql(g.slug)}, ${escapeSql(g.createdByUserId)}, ${escapeSql(g.createdAt)}, ${escapeSql(g.updatedAt)});`
    );
  }

  // Group Permissions
  for (const row of gp) {
    statements.push(
      `INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES (${escapeSql(row.groupId)}, ${escapeSql(row.permissionId)});`
    );
  }

  // Timezones
  for (const t of tz) {
    statements.push(
      `INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES (${escapeSql(t.ianaId)}, ${escapeSql(t.baseOffsetMinutes)}, ${escapeSql(t.isDstSupported)});`
    );
  }

  // System Settings
  for (const s of ss) {
    statements.push(
      `INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES (${escapeSql(s.key)}, ${escapeSql(s.value)}, ${escapeSql(s.description)}, ${escapeSql(s.updatedAt)});`
    );
  }

  const dir = resolve("backend/drizzle-sqlite/20260824050000_system_bootstrap_data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/migration.sql`, statements.join("\n--> statement-breakpoint\n"), "utf8");
}

if (import.meta.main) {
  await exportSystemDataToSqlite();
  process.exit(0);
}
