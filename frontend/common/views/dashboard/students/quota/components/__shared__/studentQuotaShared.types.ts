import type { SxProps, Theme } from "@mui/material";
import type { ComponentType, ReactElement, ReactNode } from "react";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";

interface QuotaFormActionComponentProps {
  readonly type: "submit" | "button";
  readonly variant?: "text" | "contained" | "outlined";
  readonly disabled?: boolean;
  readonly startIcon?: ReactElement;
  readonly onClick?: () => void;
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

type QuotaFormActionComponent = ComponentType<Readonly<QuotaFormActionComponentProps>>;

interface QuotaFormSectionComponents {
  readonly StudentInformationSection: () => ReactElement | null;
  readonly CourseDetailsSection: () => ReactElement | null;
  readonly ContextualHelperCards: () => ReactElement | null;
}

interface QuotaFormHeaderRenderProps {
  readonly t: {
    readonly breadcrumbs: {
      readonly students: string;
      readonly adjustQuota: string;
    };
  };
  readonly studentData: StudentProfileData;
}

type QuotaFormHeaderRenderer = (props: Readonly<QuotaFormHeaderRenderProps>) => ReactElement | null;

interface QuotaFormCardSx {
  readonly useCardStyling: boolean;
  readonly formPadding: number;
  readonly formGap: number;
}

/**
 * Layout-only knobs that genuinely differ between tiers. Button appearance
 * (height, padding, width, hover surface) is preset-encoded in the
 * MobilePrimaryPageAction / DesktopPrimaryPageAction primitives and must not
 * be re-created per tier.
 */
interface QuotaFormActionsSx {
  readonly containerPaddingTop: number;
  readonly containerDirection: "row" | "column";
  readonly innerDirection: "row" | "column";
  readonly innerGap: number;
  readonly innerWidth: "auto" | "100%";
}

type ContextualHelperCardsWrapper = (children: ReactElement) => ReactElement;

export interface StudentQuotaTierConfig {
  readonly PrimaryAction: QuotaFormActionComponent;
  readonly sections: QuotaFormSectionComponents;
  readonly renderHeader: QuotaFormHeaderRenderer;
  readonly cardSx: QuotaFormCardSx;
  readonly actionsSx: QuotaFormActionsSx;
  readonly wrapContextualHelperCards: ContextualHelperCardsWrapper;
}
