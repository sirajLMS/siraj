import type { ButtonProps } from "@mui/material";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";
import type {
  EffectiveMeetingFieldsFragment,
  TeacherFutureScheduleQuery_teacherFutureSchedule_classes,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

/** Props shared across both tiers — identical for FutureClassCardDesktop and FutureClassCardMobile. */
export interface FutureClassCardSharedProps {
  readonly item: TeacherFutureScheduleQuery_teacherFutureSchedule_classes;
  readonly onRequestLeave?: () => void;
  readonly labels: TeacherFutureScheduleLabels;
}

/**
 * Slot props for the FutureClassCardShared scaffold.
 * Each tier passes its own tier-specific components that accept these prop shapes.
 */
export interface FutureClassCardSlots {
  /**
   * Wrapping card component (BaseCard / MobileCardListItem).
   * Accepts `children` and optional `sx` for tier-specific card styling.
   */
  readonly CardComponent: React.ComponentType<{ readonly children: React.ReactNode; readonly sx?: object }>;
  /**
   * Class profile link render function (DesktopClassProfileLink / MobileClassProfileLink).
   * Uses a render function instead of ComponentType to avoid contravariance issues
   * between desktop's UiTypographyVariant and mobile's UiTypographyVariantLoose.
   * The scaffold provides `href`, `name`, and `avatarUrl`; each tier's wrapper
   * supplies its own `typographyVariant` and `fontWeight` as hardcoded values.
   */
  readonly ClassProfileLink: (props: {
    readonly href?: string | null;
    readonly name: string;
    readonly avatarUrl?: string | null;
  }) => React.ReactNode;
  /** Status badge component (StatusBadge / MobileStatusBadge). */
  readonly StatusBadge: React.ComponentType<{
    readonly category: StatusBadgeCategory;
    readonly status: string;
    readonly label: string;
  }>;
  /** Meeting join action component (MeetingJoinAction / MobileMeetingJoinAction). */
  readonly MeetingJoinAction: React.ComponentType<{
    readonly variant?: "button" | "action" | "icon";
    readonly meeting?: EffectiveMeetingFieldsFragment | null;
    readonly emptyRole?: "teacher" | "parent" | "class";
    readonly label?: string;
    readonly setupHref?: string;
  }>;
  /** Outlined action preset for the request-leave button (FilterButton / MobileFilterButton). */
  readonly LeaveRequestButton: React.ComponentType<ButtonProps>;
  /** Contained action preset for the view-materials button (PrimaryPageAction / MobilePrimaryPageAction). */
  readonly ViewMaterialsButton: React.ComponentType<ButtonProps>;
}

/** Tier-specific styling values passed to the scaffold. */
export interface FutureClassCardStyleProps {
  /** Info stack spacing between time, location, student count. */
  readonly infoStackSpacing: number;
  /** Info stack flexWrap gap. */
  readonly infoStackGap: number;
  /** Action buttons container alignSelf. */
  readonly actionButtonsAlignSelf: "center" | "stretch";
  /** Action button flex value. */
  readonly actionButtonFlex: number | string;
  /** Materials button horizontal padding. */
  readonly materialsButtonPx: number;
  /** Outer layout direction ("row" for desktop side-by-side, "column" for mobile stacked). */
  readonly outerDirection: "row" | "column";
}

/** Full scaffold props — shared props + slots + styling. */
export interface FutureClassCardScaffoldProps extends FutureClassCardSharedProps {
  readonly slots: FutureClassCardSlots;
  readonly style: FutureClassCardStyleProps;
}
