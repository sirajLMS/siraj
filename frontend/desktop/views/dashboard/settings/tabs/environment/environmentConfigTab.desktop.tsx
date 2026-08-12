"use client";

import { EnvironmentConfigTabShared } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/environmentConfigTabShared";
import { DESKTOP_ENV_CONFIG_OPTIONS } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/environmentConfigTabShared.options";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

export function EnvironmentConfigTabDesktopView(viewModel: Readonly<EnvironmentConfigViewModel>) {
  return <EnvironmentConfigTabShared viewModel={viewModel} options={DESKTOP_ENV_CONFIG_OPTIONS} />;
}
