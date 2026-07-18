/**
 * Side-effect imports that register all Pothos types, queries, and mutations
 * on `gqlSchemaBuilder`.
 *
 * Kept in a dedicated module so `gqlSchemaBuilder.ts` can dynamically import it
 * in development. That dynamic import creates an HMR dependency edge: when any
 * schema definition changes, the builder module is invalidated too, yielding a
 * fresh SchemaBuilder before types re-register (see hayes/pothos#49).
 */
import "@/backend/graphql/pothos";
import "@/backend/graphql/query";
import "@/backend/graphql/mutation";
import "@/backend/graphql/pothos/schema.types";
