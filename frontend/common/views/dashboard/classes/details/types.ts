export type ClassDetailsViewMode = "teacher" | "parent";

export interface ActionFeedbackState {
  readonly message: string;
  readonly severity: "success" | "error";
}

export interface EntityLinkTargets {
  readonly studentId: string;
  readonly teacherId: string;
}

import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import type { ClassDetailsLabels } from "@/shared/locale";

export function formatClassDetailDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(getLatnLocaleTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export interface SessionActionProps {
  readonly onStart: () => void;
  readonly onAbsent: () => void;
  readonly onLeave: (reason: string) => void;
  readonly onReset: () => void;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: string | null;
}

export interface ActionFeedbackState {
  readonly message: string;
  readonly severity: "success" | "error";
}

export interface ClassActionHandlers {
  readonly handleForceActivate: () => Promise<void>;
  readonly handleStop: () => Promise<void>;
  readonly handleActivate: () => Promise<void>;
  readonly handleDeleteConfirm: () => Promise<void>;
  readonly handleReschedule: () => void;
  readonly handleInfoEdit: () => void;
}

export interface CommonViewProps {
  readonly instance: ClassInstanceDetail;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onStop: () => void;
  readonly onDelete: () => void;
  readonly onStart: () => Promise<void>;
  readonly onAbsent: () => Promise<void>;
  readonly onLeave: (reason: string) => Promise<void>;
  readonly onReset: () => Promise<void>;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: string | null;
}

export interface AdminViewProps extends CommonViewProps {
  readonly onForceActivate: () => void;
  readonly onGenerateLog: () => void;
  readonly onReschedule: () => void;
}

export interface TeacherViewProps extends CommonViewProps {
  readonly viewMode: ClassDetailsViewMode;
  readonly onActivate: () => void;
  readonly onInfoEdit: () => void;
}

// NEW FOR PLAN v5: lifted from classDetailsContent.{mobile,desktop}.tsx inline declaration
// specs.md §4.1 Class-B unified shape (mobile/desktop content bodies were identical).
export interface TierSessionActionProps {
  readonly onStart: () => Promise<void>;
  readonly onAbsent: () => Promise<void>;
  readonly onLeave: (reason: string) => Promise<void>;
  readonly onReset: () => Promise<void>;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: null;
}

// NEW FOR PLAN v5: lifted from classDetailsHeader.{mobile,desktop}.tsx inline declaration
// specs.md §4.1 Class-B unified shape (mobile/desktop header bodies were identical modulo tier PageHeader import).
export interface ClassDetailsHeaderProps {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
}

// NEW FOR PLAN v5: lifted from classDetailsContent.{mobile,desktop}.tsx inline declaration
// specs.md §4.1 Class-B unified shape (mobile/desktop content prop contracts were identical).
export interface ClassDetailsContentProps {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
  readonly isParentView: boolean;
  readonly canViewSessionDetails: boolean;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly handlers: ClassActionHandlers;
  readonly sessionActionProps: TierSessionActionProps;
  readonly feedbackState: ActionFeedbackState | null;
  readonly deleteDialogOpen: boolean;
  readonly onCloseDeleteDialog: () => void;
  readonly onConfirmDelete: () => Promise<void>;
  readonly t: ClassDetailsLabels;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
}

// NEW FOR PLAN v5: lifted from classDetailsContainer.{mobile,desktop}.tsx inline declaration
// specs.md §4.1 Class-B unified shape.
export interface InvalidIdStateProps {
  readonly t: ClassDetailsLabels;
}
