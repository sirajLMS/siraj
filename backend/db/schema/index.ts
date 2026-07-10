// Drizzle schema definitions — grouped by domain.
// Each sub-directory has its own index.ts barrel that re-exports every
// table definition in that sub-directory; this file re-exports them all
// plus the cross-cutting `enums` and `custom-types` that stay top-level.
// `import { teachers, users, ... } from "@/backend/db/schema"` resolves
// every Drizzle table.

export * from "./audit";
export * from "./auth";
export * from "./billing";
export * from "./books";
export * from "./classes";
export * from "./communications";
export * from "./custom-types";
export * from "./enums";
export * from "./parents";
export * from "./permissions";
export * from "./shared";
export * from "./storage";
export * from "./students";
export * from "./teachers";
export * from "./users";
