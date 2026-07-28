import { headers } from "next/headers";

/**
 * Detects whether the current request is a Next.js/router prefetch.
 *
 * Browsers annotate prefetch requests with the `Sec-Purpose: prefetch` request
 * header (legacy `X-Purpose: prefetch`). When `true`, the request is a
 * background prefetch issued by the Next.js App Router `<Link>` client — it is
 * NOT a user-driven navigation. Server-side permission/layout guards use this
 * to avoid returning a redirect (307) to prefetches, since the App Router
 * honours redirects on prefetches and that can produce an infinite
 * `/dashboard → /forbidden → /dashboard` bounce (reproduced via
 * `vercel logs --follow`).
 *
 * Read once per request and thread through `requirePermissionForPage` etc.
 * instead of re-reading `headers()` inside each guard — `headers()` is cached
 * per-request so the cost is negligible, but explicit threading keeps the
 * guard functions pure and unit-testable.
 */
export async function isPrefetchRequest(): Promise<boolean> {
  const h = await headers();
  return h.get("sec-purpose") === "prefetch" || h.get("x-purpose") === "prefetch";
}
