import { z } from "zod";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

export const SYSTEM_SETTING_DATA_TYPES = ["string", "integer"] as const;

export type SystemSettingDataType = (typeof SYSTEM_SETTING_DATA_TYPES)[number];

export function createSystemSettingFormSchema(labels: Pick<SettingsGeneralTabLabels, "keyRequired" | "valueRequired">) {
  return z.object({
    key: z.string().trim().min(1, labels.keyRequired),
    value: z.string().trim().min(1, labels.valueRequired),
    dataType: z.enum(SYSTEM_SETTING_DATA_TYPES),
    description: z.string().optional(),
    category: z.string().optional(),
  });
}

export type SystemSettingFormValues = z.infer<ReturnType<typeof createSystemSettingFormSchema>>;
