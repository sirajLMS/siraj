import type { SxProps, Theme } from "@mui/material";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";

export const PACKAGE_PLAN_CURRENCY_OPTIONS: readonly CurrencyCode[] = [
  CurrencyCode.Egp,
  CurrencyCode.Usd,
  CurrencyCode.Sar,
  CurrencyCode.Aed,
];

export const PACKAGE_PLAN_VALIDITY_CHOICES: readonly number[] = [1, 3, 6, 12];

/** Per-tier sizing overrides for the package plan form fields (undefined = natural size). */
export interface PackagePlanFormFieldStyles {
  readonly codenameField?: SxProps<Theme>;
  readonly codenameInput?: SxProps<Theme>;
  readonly displayNameField?: SxProps<Theme>;
  readonly descriptionField?: SxProps<Theme>;
  readonly numericField?: SxProps<Theme>;
  readonly currencyField?: SxProps<Theme>;
  readonly sortOrderField?: SxProps<Theme>;
  readonly validityStack?: SxProps<Theme>;
}

export const DESKTOP_PACKAGE_PLAN_FORM_STYLES: PackagePlanFormFieldStyles = {
  codenameField: { flex: 1, minWidth: 300 },
  codenameInput: { fontFamily: "monospace" },
  displayNameField: { flex: 1, minWidth: 300 },
  descriptionField: { width: "100%" },
  numericField: { flex: 1, minWidth: 150 },
  currencyField: { flex: 1, minWidth: 160 },
  sortOrderField: { width: 200 },
  validityStack: { flex: 1, minWidth: 280 },
};

export const MOBILE_PACKAGE_PLAN_FORM_STYLES: PackagePlanFormFieldStyles = {
  numericField: { flex: 1 },
  currencyField: { flex: 1 },
  sortOrderField: { flex: 1 },
  validityStack: { width: "100%" },
};
