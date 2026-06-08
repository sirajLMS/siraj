import { pgEnum } from "drizzle-orm/pg-core";

export function createPgEnumFromEnum(
	enumName: string,
	enumObject: Record<string, string>,
) {
	return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);
}
