// Side-effect import: registers Cron query/mutation fields with gqlSchemaBuilder.
// The module owns no named exports — all object/enum types are registered
// imperatively via `gqlSchemaBuilder.queryField(...)` / `.mutationField(...)`.
import "./cron.pothos";
