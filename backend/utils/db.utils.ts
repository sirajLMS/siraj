import { pgEnum } from "drizzle-orm/pg-core";

export function createPgEnumFromEnum(enumName: string, enumObject: Record<string, string>) {
  return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);
}

export function escapeLikeWildcards(input: string): string {
  return input.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_"); // NoSonar - string escapes are intentional for LIKE wildcard escaping
}
