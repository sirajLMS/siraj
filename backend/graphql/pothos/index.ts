// Pothos GraphQL schema definitions — grouped by domain.
// Each sub-directory has its own index.ts barrel; this file re-exports them all
// so that `import "@/backend/graphql/pothos"` (from gqlSchema.ts) and
// `import * as Pothos from "@/backend/graphql/pothos"` (from query/mutation)
// continue to resolve every Pothos object.

export * from "./accounting";
export * from "./auth";
export * from "./billing";
export * from "./books";
export * from "./classes";
export * from "./complaints";

// Side-effect import: registers Cron query/mutation fields with gqlSchemaBuilder.
// The cron submodule owns no named exports (object/enum types are registered
// imperatively).
import "./cron";

export * from "./expenses";
export * from "./meeting";
export * from "./notifications";
export * from "./parents";
export * from "./permissions";
export * from "./profile";
export * from "./reports";
export * from "./scheduling";
export * from "./shared";
export * from "./storage";
export * from "./students";
export * from "./supervisor";
export * from "./system";
export * from "./teachers";
export * from "./users";
export * from "./whatsapp";
