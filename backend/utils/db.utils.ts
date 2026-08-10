import { pgEnum } from "drizzle-orm/pg-core";

function isNonEmptyStringArray(values: string[]): values is [string, ...string[]] {
  return values.length > 0;
}

export function createPgEnumFromEnum(enumName: string, enumObject: Record<string, string>) {
  const values = Object.values(enumObject);
  if (!isNonEmptyStringArray(values)) {
    throw new Error(`Cannot create pgEnum "${enumName}": enum must have at least one value.`);
  }
  return pgEnum(enumName, values);
}

export function escapeLikeWildcards(input: string): string {
  return input.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_"); // NoSonar - string escapes are intentional for LIKE wildcard escaping
}
