import { getRequestReturnPath } from "@/frontend/common/lib/redirectToLogin";

/**
 * @deprecated Prefer `getRequestReturnPath` from `@/frontend/lib/redirectToLogin`.
 * Kept as a thin alias for any lingering dashboard imports.
 */
export async function getDashboardPathname(): Promise<string> {
  return getRequestReturnPath();
}
