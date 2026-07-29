"use client";

import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import type { SettingsTabNavVariantProps } from "@/frontend/common/views/dashboard/settings/types/settingsTabNav.types";

/**
 * Backwards-compat shim used by the Settings page. Now that the tab nav is
 * generic over any `string` tab id (see
 * `@/frontend/common/views/dashboard/components/GenericTabNav`), new parents
 * reuse the same component directly; Settings keeps this named export for
 * clarity. The per-tier Settings-specific tab nav files were removed — the
 * generic tiers already mirror their markup verbatim.
 */
export function SettingsTabNav({ activeTab, tabs }: Readonly<SettingsTabNavVariantProps>) {
  return <GenericTabNav activeTab={activeTab} tabs={tabs} ariaLabel="Settings sections" />;
}
