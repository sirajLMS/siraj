import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType, ReactElement } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import type { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaFormFieldAccess } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types";
import type {
  QuotaFormData,
  QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface DatePickerSlotProps {
  readonly label: string;
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly disabled: boolean;
  readonly error: boolean;
  readonly helperText?: string;
  readonly fullWidth: boolean;
  readonly sx?: SxProps<Theme>;
}

export interface DatePickerSlot {
  readonly component: ComponentType<DatePickerSlotProps>;
}

export type SectionWrapper = (props: Readonly<{ title: string; children: ReactElement }>) => ReactElement;

export interface SectionFieldProps {
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly labels: QuotaLabels;
  readonly isEditing: boolean;
  readonly watchKind: QuotaKind | undefined;
  readonly watchPeriodType: QuotaPeriodType | null | undefined;
  readonly fieldAccess: QuotaFormFieldAccess;
  readonly datePickerSlot: DatePickerSlot;
}
