import type { SxProps, Theme } from "@mui/material";
import type { ComponentType, ReactElement, ReactNode } from "react";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";

export interface QuotaFormActionComponentProps {
  readonly type: "submit" | "button";
  readonly variant?: "text" | "contained" | "outlined";
  readonly disabled?: boolean;
  readonly startIcon?: ReactElement;
  readonly onClick?: () => void;
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

export type QuotaFormActionComponent = ComponentType<Readonly<QuotaFormActionComponentProps>>;

export interface QuotaFormSectionComponents {
  readonly StudentInformationSection: () => ReactElement | null;
  readonly CourseDetailsSection: () => ReactElement | null;
  readonly ContextualHelperCards: () => ReactElement | null;
}

export interface QuotaFormHeaderRenderProps {
  readonly t: {
    readonly breadcrumbs: {
      readonly students: string;
      readonly adjustQuota: string;
    };
  };
  readonly studentData: StudentProfileData;
}

export type QuotaFormHeaderRenderer = (props: Readonly<QuotaFormHeaderRenderProps>) => ReactElement | null;

export interface QuotaFormCardSx {
  readonly useCardStyling: boolean;
  readonly formPadding: number;
  readonly formGap: number;
}

export interface QuotaFormActionsSx {
  readonly containerPaddingTop: number;
  readonly containerDirection: "row" | "column";
  readonly innerDirection: "row" | "column";
  readonly innerGap: number;
  readonly innerWidth: "auto" | "100%";
  readonly saveButtonHeight: number;
  readonly saveButtonPx: number;
  readonly saveButtonWidth: "auto" | "100%";
  readonly cancelButtonHeight: number;
  readonly cancelButtonPx: number;
  readonly cancelButtonHoverBg: "transparent" | "surfaceContainerLow";
  readonly cancelButtonWidth: "auto" | "100%";
}

export type ContextualHelperCardsWrapper = (children: ReactElement) => ReactElement;

export interface StudentQuotaTierConfig {
  readonly PrimaryAction: QuotaFormActionComponent;
  readonly sections: QuotaFormSectionComponents;
  readonly renderHeader: QuotaFormHeaderRenderer;
  readonly cardSx: QuotaFormCardSx;
  readonly actionsSx: QuotaFormActionsSx;
  readonly wrapContextualHelperCards: ContextualHelperCardsWrapper;
}
