import type { ButtonProps } from "@mui/material";
import type { ComponentType } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";

/**
 * Action presets used by the meeting-config shared components. Tier views may
 * inject their tier variants (e.g. MobilePrimaryPageAction / MobileFilterButton)
 * so each preset owns its own touch-target and full-width behavior; the shared
 * defaults keep the tier-neutral presets.
 */
export type MeetingConfigActionSlots = {
  readonly primary: ComponentType<ButtonProps>;
  readonly outlined: ComponentType<ButtonProps>;
};

export const DEFAULT_MEETING_CONFIG_ACTION_SLOTS: MeetingConfigActionSlots = {
  primary: PrimaryPageAction,
  outlined: FilterButton,
};
