"use client";

/**
 * @deprecated Re-export — the parent-support FAB now lives in the desktop
 * tier (`@/frontend/desktop/views/dashboard/parent/dashboard/components/parentSupportFab.desktop`).
 * This common alias is retained so OUT-OF-SCOPE consumers (currently the
 * teachers desktop dashboard) keep type-checking during the staged tier
 * split. Consumers inside `frontend/desktop/views/dashboard/teachers/**`
 * (Plan E scope) should migrate to the desktop path directly and this file
 * should be deleted once no remaining common consumers exist.
 */
export { ParentSupportFabDesktop as ParentSupportFab } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentSupportFab.desktop";
