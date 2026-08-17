import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface QuotaFormFieldAccess {
  readonly studentId: { readonly disabled: boolean; readonly helperText: string | null };
  readonly name: { readonly disabled: boolean; readonly helperText: string | null };
  readonly kind: { readonly disabled: boolean; readonly helperText: string | null };
  readonly totalClasses: { readonly disabled: boolean; readonly helperText: string | null };
  readonly priority: { readonly disabled: boolean; readonly helperText: string | null };
  readonly validFrom: { readonly disabled: boolean; readonly helperText: string | null };
  readonly validUntil: { readonly disabled: boolean; readonly helperText: string | null };
  readonly periodType: { readonly disabled: boolean; readonly helperText: string | null };
  readonly periodDays: { readonly disabled: boolean; readonly helperText: string | null };
}

export interface QuotaFormAccessContextValue {
  readonly readOnly: boolean;
  readonly canManage: boolean;
  readonly canView: boolean;
  readonly fieldAccess: QuotaFormFieldAccess;
  readonly labels: QuotaLabels;
}
