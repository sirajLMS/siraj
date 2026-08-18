import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

type StringEnum = Record<string, string>;

function isEnumValue<T extends StringEnum>(enumObject: T, value: string): value is T[keyof T] {
  const enumValues: readonly string[] = Object.values(enumObject);
  return enumValues.includes(value);
}

function parseEnumValue<T extends StringEnum>(
  enumObject: T,
  value: string | null | undefined,
  fallback: T[keyof T] | null = null
): T[keyof T] | null {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (isEnumValue(enumObject, value)) {
    return value;
  }

  return fallback;
}

export const parseParentStatus = (
  value: string | null | undefined,
  fallback: ParentStatus = ParentStatus.Regular
): ParentStatus => parseEnumValue(ParentStatus, value, fallback) ?? fallback;
