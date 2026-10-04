import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface ParentOnboardingSharedOptions {
  readonly formGap: number;
  readonly formSx: Record<string, unknown>;
  readonly alertSx: SxProps<Theme>;
  readonly statusBadgeSx: SxProps<Theme>;
  readonly statusBadgeIconSize: number;
  readonly statusBadgeTypographyVariant: "labelMd" | "labelSm";
  readonly submitBoxSx: SxProps<Theme>;
  readonly submitButtonSx: SxProps<Theme>;
  readonly renderPageContainer: (children: ReactNode) => ReactNode;
  readonly renderPageHeader: (title: string, subtitle: string, actions: ReactNode) => ReactNode;
  readonly renderSectionPanel: (title: string, children: ReactNode) => ReactNode;
  readonly renderSubmitButton: (props: {
    readonly isSubmitting: boolean;
    readonly processingLabel: string;
    readonly signupLabel: string;
  }) => ReactNode;
  readonly renderSuccessSnackbar: (open: boolean, message: string, onClose: () => void) => ReactNode;
  readonly renderFormSections: (sections: ReactNode, meetingConfigSection: ReactNode) => ReactNode;
}
