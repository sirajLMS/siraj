/**
 * Barrel exports for the Meta Cloud API adapter layer.
 *
 * Re-exports the Graph API adapter, shared runtime helpers, and the v1 core
 * set of request builders (Q1). Integration tests and the channel factory
 * import from this barrel rather than reaching into individual files.
 *
 * Type definitions live in the types layer at
 * `@/backend/types/whatsapp/whatsapp-cloud-api.types.ts` (re-exported via
 * `@/backend/types`).
 *
 * Each `*.request.ts` file exports uniquely-named `build*Request` and
 * `parse*Response` functions so the `requests` barrel can use `export *`
 * exclusively without aliasing.
 */

// Adapter (Task 5)
export * from "./MetaCloudApiAdapter";
// Shared runtime helpers (Task 4)
export * from "./meta-cloud-api.helpers";
// Request builders — v1 core set only (Q1)
export * from "./requests";
