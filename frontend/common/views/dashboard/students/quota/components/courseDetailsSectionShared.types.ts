import type { SxProps, Theme } from "@mui/material";
import type { SystemStyleObject } from "@mui/system/styleFunctionSx";
import type { ComponentType, ElementType, ReactNode } from "react";
import type { TeacherAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";

/**
 * Props for the end-adornment shown inside the "classes left" field when
 * an override is active. Each tier supplies its own icon and styling.
 */
interface ClassesLeftOverrideEndAdornmentProps {
  readonly icon: ElementType;
  readonly iconFontSize: number;
  readonly boxSx: SxProps<Theme>;
  readonly typographySx: SxProps<Theme>;
}

/**
 * Props for the override notice typography shown below the "classes left"
 * field when editing is allowed.
 */
interface ClassesLeftOverrideNoticeProps {
  readonly icon: ElementType | undefined;
  readonly iconFontSize: number | undefined;
  readonly sx: SxProps<Theme>;
}

/**
 * sx factory for the "classes left" TextField outlined-input root.
 */
type ClassesLeftInputSxFactory = (theme: Theme) => SystemStyleObject<Theme>;

/**
 * Slot props supplied by each tier wrapper to
 * {@link CourseDetailsSectionShared}.
 *
 * The scaffold renders the full course-details section body (teacher
 * picker, total classes, classes left fields plus the restricted
 * state) and lets the mobile/desktop caller swap the tier-specific
 * section header, icons, teacher picker facade, layout, and
 * "classes left" override styling.
 */
export interface CourseDetailsSectionSlotProps {
  /** Renders the tier-specific section header with the given title. */
  readonly renderHeader: (title: string) => ReactNode;
  /** Tier-specific permission-scoped teacher picker facade. */
  readonly TeacherAutocomplete: ComponentType<TeacherAutocompleteProps>;
  /** Outer container gap. Desktop 4, mobile 3. */
  readonly rootGap: number;
  /** CSS layout for fields container. Desktop uses grid, mobile uses flex column. */
  readonly fieldsContainerSx: SxProps<Theme>;
  /** End-adornment props for the "classes left" override indicator. */
  readonly overrideEndAdornment: ClassesLeftOverrideEndAdornmentProps;
  /** Notice shown below the "classes left" field when editing is allowed. */
  readonly overrideNotice: ClassesLeftOverrideNoticeProps;
  /** sx factory for the "classes left" TextField outlined-input root. */
  readonly classesLeftInputSx: ClassesLeftInputSxFactory;
}

export interface CourseDetailsSectionSharedProps {
  readonly slots: CourseDetailsSectionSlotProps;
}
