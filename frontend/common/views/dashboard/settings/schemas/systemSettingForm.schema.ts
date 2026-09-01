import { z } from "zod";
import { SystemSettingDataType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

export { SystemSettingDataType };

export type SystemSettingValueLabels = Pick<
  SettingsGeneralTabLabels,
  "valueRequired" | "valueInteger" | "valueBoolean" | "valueJson"
>;

const parseJson = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const valueSchemaByDataType = {
  [SystemSettingDataType.String]: (labels: SystemSettingValueLabels) => z.string().trim().min(1, labels.valueRequired),
  [SystemSettingDataType.Integer]: (labels: SystemSettingValueLabels) =>
    z
      .string()
      .trim()
      .min(1, labels.valueRequired)
      .refine(v => Number.isInteger(Number(v)) && Number(v) >= 0, { message: labels.valueInteger }),
  [SystemSettingDataType.Boolean]: (labels: SystemSettingValueLabels) =>
    z.enum(["true", "false"], { message: labels.valueBoolean }),
  [SystemSettingDataType.Json]: (labels: SystemSettingValueLabels) =>
    z.string().min(1, labels.valueRequired).refine(parseJson, { message: labels.valueJson }),
} as const;

/**
 * Validates a system setting value using GraphQL enum types.
 * If shared enum is passed, it will be converted to GraphQL enum.
 */
export function validateSystemSettingValue(
  dataType: SystemSettingDataType,
  value: string,
  labels: SystemSettingValueLabels
): string | null {
  const result = valueSchemaByDataType[dataType](labels).safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? labels.valueRequired);
}
