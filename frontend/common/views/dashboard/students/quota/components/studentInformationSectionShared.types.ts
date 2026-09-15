import type { SxProps, Theme } from "@mui/material";
import type { ComponentType, ElementType } from "react";
import type { GenderSelectorProps } from "@/frontend/common/components/ui/input/genderSelector";
import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Props the shared scaffold passes to whichever language display
 * ({@code DesktopLanguageDisplay} or {@code MobileLanguageDisplay}) the tier injects.
 */
interface StudentInfoLanguageDisplayProps {
  readonly code: AppLanguage | null;
  readonly fallback?: string;
}

/**
 * Props the shared scaffold passes to whichever date picker
 * ({@code AppDatePicker} or {@code MobileAppDatePicker}) the tier injects.
 * Both implementations accept the same surface the scaffold relies on:
 * `value`, `onChange`, and `slotProps.textField.*`.
 */
export interface StudentInfoDatePickerProps {
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly slotProps?: {
    readonly textField?: {
      readonly label?: string;
      readonly variant?: "outlined" | "standard" | "filled";
      readonly fullWidth?: boolean;
      readonly disabled?: boolean;
      readonly error?: boolean;
      readonly helperText?: string;
      readonly sx?: SxProps<Theme>;
      readonly slotProps?: { readonly htmlInput?: { readonly autoComplete?: string } };
    };
  };
}

/**
 * Slot props supplied by each tier wrapper to
 * {@link StudentInformationSectionShared}.
 *
 * The scaffold renders the full student-information section body
 * (name, date of birth, language, gender fields plus the restricted state)
 * and lets the mobile/desktop caller swap the tier-specific date picker and
 * section header primitives plus a few numeric layout slots.
 */
export interface StudentInformationSectionSlotProps {
  /** Tier-specific date picker (AppDatePicker or MobileAppDatePicker). */
  readonly DatePicker: ComponentType<StudentInfoDatePickerProps>;
  /** Tier-specific language display (DesktopLanguageDisplay or MobileLanguageDisplay). */
  readonly LanguageDisplay: ComponentType<StudentInfoLanguageDisplayProps>;
  /** Tier-specific gender selector (GenderSelectorDesktop or GenderSelectorMobile); rendered read-only. */
  readonly GenderSelector: ComponentType<GenderSelectorProps>;
  /** Tier-specific section header accepting a title and icon prop (see wrappers in each tier file). */
  readonly SectionHeader: ComponentType<{
    readonly title: string;
    readonly icon: ElementType;
  }>;
  /** Icon rendered inside the section header (BadgeOutlined for both tiers). */
  readonly sectionHeaderIcon: ElementType;
  /** Outer container gap. Desktop 4, mobile 3. */
  readonly rootGap: number;
  /** Fields container gap. Desktop 4, mobile 2. */
  readonly fieldsGap: number;
  /** CSS grid template for fields (e.g. "1fr 1fr" or "1fr"). Desktop 2 cols, mobile 1 col. */
  readonly gridTemplateColumns: string;
  /** Horizontal padding on the gender field container. Desktop 0, mobile 0.5. */
  readonly genderFieldPx: number;
  /** Optional sx overrides for the outer container. */
  readonly rootSx?: SxProps<Theme>;
}

export interface StudentInformationSectionSharedProps {
  readonly slots: StudentInformationSectionSlotProps;
}
