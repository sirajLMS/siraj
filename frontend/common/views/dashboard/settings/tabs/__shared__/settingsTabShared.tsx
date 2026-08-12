"use client";

import { Stack } from "@mui/material";
import type { ReactNode } from "react";

export interface SettingsTabSharedOptions {
  readonly gap: number;
}

export function SettingsTabShared({
  filterBar,
  dataGrid,
  options,
}: Readonly<{
  readonly filterBar: ReactNode;
  readonly dataGrid: ReactNode;
  readonly options: SettingsTabSharedOptions;
}>) {
  return (
    <Stack sx={{ gap: options.gap }}>
      {filterBar}
      {dataGrid}
    </Stack>
  );
}
