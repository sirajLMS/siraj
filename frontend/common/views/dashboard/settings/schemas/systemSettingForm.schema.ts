import { z } from "zod";
import { SystemSettingCategory, SystemSettingDataType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

export { SystemSettingCategory, SystemSettingDataType };

export const SYSTEM_SETTING_DATA_TYPES = Object.values(SystemSettingDataType) as readonly SystemSettingDataType[];
export const SYSTEM_SETTING_CATEGORIES = Object.values(SystemSettingCategory) as readonly SystemSettingCategory[];

export type SystemSettingFormLabels = Pick<
  SettingsGeneralTabLabels,
  "keyRequired" | "valueRequired" | "valueInteger" | "valueBoolean" | "valueJson"
>;

const parseJson = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

export function createSystemSettingFormSchema(labels: SystemSettingFormLabels) {
  return z.discriminatedUnion("dataType", [
    z.object({
      key: z.string().trim().min(1, labels.keyRequired),
      value: z.string().trim().min(1, labels.valueRequired),
      dataType: z.literal(SystemSettingDataType.String),
      description: z.string().optional(),
      category: z.enum(SYSTEM_SETTING_CATEGORIES),
    }),
    z.object({
      key: z.string().trim().min(1, labels.keyRequired),
      value: z
        .string()
        .trim()
        .min(1, labels.valueRequired)
        .refine(v => Number.isInteger(Number(v)) && Number(v) >= 0, { message: labels.valueInteger }),
      dataType: z.literal(SystemSettingDataType.Integer),
      description: z.string().optional(),
      category: z.enum(SYSTEM_SETTING_CATEGORIES),
    }),
    z.object({
      key: z.string().trim().min(1, labels.keyRequired),
      value: z.enum(["true", "false"], { message: labels.valueBoolean }),
      dataType: z.literal(SystemSettingDataType.Boolean),
      description: z.string().optional(),
      category: z.enum(SYSTEM_SETTING_CATEGORIES),
    }),
    z.object({
      key: z.string().trim().min(1, labels.keyRequired),
      value: z.string().min(1, labels.valueRequired).refine(parseJson, { message: labels.valueJson }),
      dataType: z.literal(SystemSettingDataType.Json),
      description: z.string().optional(),
      category: z.enum(SYSTEM_SETTING_CATEGORIES),
    }),
  ]);
}

export type SystemSettingFormSchema = ReturnType<typeof createSystemSettingFormSchema>;
export type SystemSettingFormValues = z.infer<SystemSettingFormSchema>;
