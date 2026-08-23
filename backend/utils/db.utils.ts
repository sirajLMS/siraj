import { createEnum } from "@/backend/db/schema/__shared__/dialectAwareBuilder";

function isNonEmptyStringArray(values: string[]): values is [string, ...string[]] {
  return values.length > 0;
}

export function createPgEnumFromEnum(enumName: string, enumObject: Record<string, string>) {
  const values = Object.values(enumObject);
  if (!isNonEmptyStringArray(values)) {
    throw new Error(`Cannot create enum "${enumName}": enum must have at least one value.`);
  }
  return createEnum(enumName, values);
}

export function escapeLikeWildcards(input: string): string {
  return input.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}
