"use client";

import { useSearchParams } from "next/navigation";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";

/**
 * Reports whether the site-appearance customizer overlay should be mounted.
 *
 * Returns `true` only when BOTH conditions hold:
 * 1. The current URL has `?customize=1` (set by the header `CustomizeButton`
 *    or the in-tab "Enter Customize Mode" CTA).
 * 2. The current user holds `SETTINGS_APPEARANCE_MANAGE` (Task 1 enum, Task
 *    3 codegen). This is a defense-in-depth re-check on top of the
 *    `RequirePermission` wrapper around `CustomizeButton` — a user could
 *    hand-craft a `?customize=1` URL even without the button being
 *    rendered, so the overlay itself must re-verify permission.
 *
 * SSR safety: `useSearchParams()` returns `null` during static rendering
 * and a live `URLSearchParams` on the client. The dashboard layout is
 * `dynamic = "force-dynamic"` (see `app/(dashboard)/layout.tsx`), so the
 * hook receives a live value at runtime; the null guard is defensive only.
 *
 * Multiple components in the dashboard tree call this hook (the desktop
 * + mobile layout shells + the sidebar shell) — each call reads the same
 * URL + user store state, so there is no duplicate fetching or state
 * divergence.
 */
export function useCustomizeMode(): boolean {
  const searchParams = useSearchParams();
  const hasPermission = useUserStore(state => state.hasPermission);

  const customizeParam = searchParams?.get("customize");
  const isCustomizeRequested = customizeParam === "1";
  const isAuthorized = hasPermission(AppPermission.SettingsAppearanceManage);

  return isCustomizeRequested && isAuthorized;
}
