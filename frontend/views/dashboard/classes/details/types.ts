export type ClassDetailsViewMode = "teacher" | "parent";

export interface ActionFeedbackState {
  readonly message: string;
  readonly severity: "success" | "error";
}

export interface EntityLinkTargets {
  readonly studentId: string;
  readonly teacherId: string;
}

import type { ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

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
