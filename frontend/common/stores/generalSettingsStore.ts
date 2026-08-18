"use client";

import { createSettingsUiStore } from "@/frontend/common/stores/__shared__/createSettingsUiStore";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";

export const useGeneralSettingsStore = createSettingsUiStore<SystemSettingRow>();
