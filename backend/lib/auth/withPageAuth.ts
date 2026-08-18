import type { ReactElement } from "react";
import type { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import type { UserPermissionContext } from "@/backend/types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { getLocale } from "@/shared/locale/server-cookies";

/**
 * Context passed to the handler by `withPageAuth`.
 */
export interface PageAuthContext {
  userId: string;
  context: UserPermissionContext | null;
  locale: string;
}

/**
 * Return type for page components — JSX.Element | null | undefined.
 */
type PageReturn = ReactElement | null | undefined;

/**
 * Higher-order function that wraps a server component page with the standard
 * auth triplet:
 *   1. `getServerUserContext()` — resolve the authenticated user
 *   2. `redirectToLogin()` if no userId
 *   3. `requirePermissionForPage()` if permissions are specified
 *
 * The handler receives `{ userId, context, locale }` plus the original page props.
 * The generic `T` is unconstrained so each page can declare its own `params` /
 * `searchParams` shape (e.g. `Promise<{ readonly id: string }>`).
 *
 * @example
 * ```tsx
 * // Permission-gated page
 * export default withPageAuth(
 *   [AppPermission.BILLING_VIEW_HISTORY],
 *   async () => {
 *     return <BillingPageContainer />;
 *   }
 * );
 *
 * // Auth-only page (no permission check)
 * export default withPageAuth(
 *   null,
 *   async () => {
 *     return <SomeContainer />;
 *   }
 * );
 *
 * // Page with params
 * export default withPageAuth(
 *   [AppPermission.QUOTAS_VIEW],
 *   async (_auth, { params }) => {
 *     const { id } = await params;
 *     return <QuotaDetailContainer quotaId={id} />;
 *   }
 * );
 * ```
 */
export function withPageAuth<T>(
  permissions: readonly AppPermission[] | null,
  handler: (auth: PageAuthContext, props: T) => Promise<PageReturn> | PageReturn
): (props: T) => Promise<PageReturn> {
  return async (props: T): Promise<PageReturn> => {
    const locale = await getLocale();
    const { userId, context } = await getServerUserContext();

    if (!userId) {
      await redirectToLogin();
      return undefined;
    }

    if (permissions && permissions.length > 0) {
      await requirePermissionForPage(userId, permissions, locale, context);
    }

    return handler({ userId, context, locale }, props);
  };
}
