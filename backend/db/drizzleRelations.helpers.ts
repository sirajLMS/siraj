import type { ExtractTablesFromSchema, RelationsBuilder } from "drizzle-orm";
import type * as schema from "@/backend/db/schema";

export type RelationsBuilderForSchema = RelationsBuilder<ExtractTablesFromSchema<typeof schema>>;
