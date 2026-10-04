/**
 * Default short-lived cache control for general (public) storage assets.
 *
 * Kept as a named constant (rather than an inline string) so the contrast
 * with the appearance-logo immutable header is explicit at the call site.
 */
export const DEFAULT_STORAGE_CACHE_CONTROL = "public, max-age=3600";

/**
 * Cache control for authenticated files served outside the `public/` prefix.
 *
 * `private` keeps shared proxies/CDNs from caching access-controlled
 * responses outside the per-request authorization check.
 */
export const PRIVATE_STORAGE_CACHE_CONTROL = "private, max-age=60";
