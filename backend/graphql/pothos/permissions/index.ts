export * from "./permission-group-simulation.objects.pothos";

// Side-effect import: registers permission-group-simulation query/mutation fields
// with gqlSchemaBuilder. The module owns no named exports (objects live in
// `./permission-group-simulation.objects.pothos`).
import "./permission-group-simulation.pothos";

export * from "./permission-management.pothos";
