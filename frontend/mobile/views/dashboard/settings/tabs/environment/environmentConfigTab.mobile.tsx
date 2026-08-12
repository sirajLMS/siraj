"use client";

import { EnvironmentConfigTabShared } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/environmentConfigTabShared";
import { MOBILE_ENV_CONFIG_OPTIONS } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/environmentConfigTabShared.options";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

export function EnvironmentConfigTabMobileView(viewModel: Readonly<EnvironmentConfigViewModel>) {
  return <EnvironmentConfigTabShared viewModel={viewModel} options={MOBILE_ENV_CONFIG_OPTIONS} />;
}
