import { pgEnum } from "drizzle-orm/pg-core";

export function createPgEnumFromEnum(enumName: string, enumObject: Record<string, string>) {
  return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);
}

export function escapeLikeWildcards(input: string): string {
  const backslashPattern = new RegExp(String.raw`\\`, "g");
  return input
    .replaceAll(backslashPattern, String.raw`\\`)
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}
