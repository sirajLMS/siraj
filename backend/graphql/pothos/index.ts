// Pothos GraphQL schema definitions — grouped by domain.
// Each sub-directory has its own index.ts barrel; this file re-exports them all
// so that `import "@/backend/graphql/pothos"` (from gqlSchema.ts) and
// `import * as Pothos from "@/backend/graphql/pothos"` (from query/mutation)
// continue to resolve every Pothos object.

export * from "@/backend/graphql/pothos/auth";
export * from "@/backend/graphql/pothos/billing";
export * from "@/backend/graphql/pothos/books";
export * from "@/backend/graphql/pothos/classes";
export * from "@/backend/graphql/pothos/complaints";

// Side-effect import: registers Cron query/mutation fields with gqlSchemaBuilder.
// The cron submodule owns no named exports (object/enum types are registered
// imperatively).
import "@/backend/graphql/pothos/cron";

export * from "@/backend/graphql/pothos/meeting";
export * from "@/backend/graphql/pothos/notifications";
export * from "@/backend/graphql/pothos/parents";
export * from "@/backend/graphql/pothos/permissions";
export * from "@/backend/graphql/pothos/profile";
export * from "@/backend/graphql/pothos/reports";
export * from "@/backend/graphql/pothos/scheduling";
export * from "@/backend/graphql/pothos/shared";
export * from "@/backend/graphql/pothos/storage";
export * from "@/backend/graphql/pothos/students";
export * from "@/backend/graphql/pothos/supervisor";
export * from "@/backend/graphql/pothos/system";
export * from "@/backend/graphql/pothos/teachers";
export * from "@/backend/graphql/pothos/users";
export * from "@/backend/graphql/pothos/whatsapp";
