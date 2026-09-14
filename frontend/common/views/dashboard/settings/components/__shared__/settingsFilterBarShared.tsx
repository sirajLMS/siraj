import { Stack } from "@mui/material";
import type { ReactNode } from "react";

export type SettingsFilterBarProps = {
  readonly children: ReactNode;
};

/**
 * Shared settings filter-bar row: column-on-mobile / row-on-desktop Stack with
 * wrapping and centered alignment. Filter selects, search fields and date
 * pickers are passed as children.
 */
export function SettingsFilterBar({ children }: Readonly<SettingsFilterBarProps>): ReactNode {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      sx={{ flexWrap: "wrap", gap: 2, alignItems: { xs: "stretch", md: "center" } }}
    >
      {children}
    </Stack>
  );
}
