import type { ReactNode } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import type { MeetingProviderFormViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";

export interface MeetingProviderFormSharedSlots {
  /** Full page wrapper (DesktopPageContainer or MobilePageContainer). */
  readonly PageContainer: React.ComponentType<{ readonly children: ReactNode }>;
  /** Page header with optional back-button action slot. */
  readonly PageHeader: React.ComponentType<{
    readonly title: string;
    readonly subtitle: string;
    readonly actions?: ReactNode;
  }>;
  /** Bordered section shell with title bar (DesktopSectionPanel or MobileSectionPanel). */
  readonly SectionPanel: React.ComponentType<{ readonly title: string; readonly children: ReactNode }>;
}

export interface MeetingProviderFormSharedStyleProps {
  /** Stack spacing between form sections (3 desktop / 2.5 mobile). */
  readonly sectionStackSpacing: number;
  /** Stack spacing inside capabilities section (1.5 desktop / 1 mobile). */
  readonly capabilitiesStackSpacing: number;
  /** Stack spacing inside identity / URL allowlist sections (2 for both). */
  readonly fieldsStackSpacing: number;
  /** Whether action buttons span fullWidth (true mobile / false desktop). */
  readonly actionsFullWidth: boolean;
  /** Actions stack spacing (2 desktop / 1.5 mobile). */
  readonly actionsStackSpacing: number;
  /** Whether actions stack right-justifies (true desktop / false mobile). */
  readonly actionsJustifyEnd: boolean;
  /** Form wrapper sx override (mobile adds px/pb). */
  readonly formSx?: Record<string, unknown>;
  /** Loading skeleton first row height (120 desktop / 100 mobile). */
  readonly loadingFirstHeight: number;
  /** Section paper wrapper for loading state (Paper desktop / Box mobile). */
  readonly LoadingWrapper: React.ComponentType<{ readonly children: ReactNode }>;
  /** Loading wrapper sx override. */
  readonly loadingWrapperSx?: Record<string, unknown>;
}

export interface MeetingProviderFormSharedProps {
  readonly mode: MeetingProviderFormViewProps["mode"];
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly errors: FieldErrors<MeetingProviderFormData>;
  readonly watch: MeetingProviderFormViewProps["watch"];
  readonly isSaving: boolean;
  readonly isLoadingProvider: boolean;
  readonly errorMsg: string | null;
  readonly isUrlExampleValid: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly slots: MeetingProviderFormSharedSlots;
  readonly styles: MeetingProviderFormSharedStyleProps;
  /** Optional back-button element rendered in the page header actions slot. */
  readonly BackAction?: ReactNode;
}

type SectionFormProps = Pick<
  MeetingProviderFormSharedProps,
  "t" | "control" | "errors" | "isSaving" | "slots" | "styles"
>;

export type LogoSectionProps = Pick<SectionFormProps, "t" | "control" | "isSaving" | "slots" | "styles">;

export type IdentitySectionProps = Pick<
  SectionFormProps,
  "t" | "control" | "errors" | "isSaving" | "slots" | "styles"
> & {
  readonly isEdit: boolean;
};

export type UrlAllowlistSectionProps = Pick<
  SectionFormProps,
  "t" | "control" | "errors" | "isSaving" | "slots" | "styles"
> & {
  readonly isUrlExampleValid: boolean;
};

export type CapabilitiesSectionProps = Pick<SectionFormProps, "t" | "control" | "isSaving" | "slots" | "styles"> & {
  readonly isActiveValue: boolean;
};

export type ActionsBarProps = Pick<SectionFormProps, "t" | "isSaving" | "styles"> & {
  readonly slugValue: string;
  readonly urlAllowlistValue: string[];
  readonly onCancel: () => void;
};

export type FormBodyProps = {
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly errors: FieldErrors<MeetingProviderFormData>;
  readonly watch: MeetingProviderFormViewProps["watch"];
  readonly isSaving: boolean;
  readonly errorMsg: string | null;
  readonly isUrlExampleValid: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly slots: MeetingProviderFormSharedSlots;
  readonly styles: MeetingProviderFormSharedStyleProps;
  readonly isEdit: boolean;
  readonly slugValue: string;
  readonly isActiveValue: boolean;
  readonly urlAllowlistValue: string[];
};
