"use client";

import { createSettingsUiStore } from "@/frontend/common/stores/__shared__/createSettingsUiStore";
import type { SessionConfigRow } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";

export const useSessionConfigSettingsStore = createSettingsUiStore<SessionConfigRow>();
