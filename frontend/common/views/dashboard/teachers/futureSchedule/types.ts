import type {
  TeacherFutureScheduleQuery_teacherFutureSchedule_classes,
  TeacherFutureScheduleQuery_teacherFutureSchedule_importantNotes,
  TeacherFutureScheduleQuery_teacherFutureSchedule_supportContact,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

export type ImportantNoteItem = TeacherFutureScheduleQuery_teacherFutureSchedule_importantNotes;
export type SupportContactData = TeacherFutureScheduleQuery_teacherFutureSchedule_supportContact;

export interface MiniCalendarDate {
  readonly num: number;
  readonly muted?: boolean;
  readonly active?: boolean;
  readonly selected?: boolean;
  readonly dot?: boolean;
}

// NEW FOR PLAN v5: MiniCalendarProps — byte-identical pair lifted from the
// mobile + desktop `futureSchedule/components/miniCalendar.*.tsx` tier files
// per specs.md §4.1 Class B (UNIFIED ORIGINAL).
export interface MiniCalendarProps {
  readonly selectedDate: string;
  readonly onSelectDate: (date: string) => void;
  readonly classDates: readonly string[];
  readonly labels: TeacherFutureScheduleLabels;
}

export interface JumpToDateHeaderProps {
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly selectedDate: string;
  readonly onDateChange: (date: string) => void;
  readonly labels: TeacherFutureScheduleLabels;
}

export interface FutureClassCardProps {
  readonly item: TeacherFutureScheduleQuery_teacherFutureSchedule_classes;
  readonly onRequestLeave?: () => void;
  readonly labels: TeacherFutureScheduleLabels;
}

export interface ImportantNotesProps {
  readonly notes: readonly ImportantNoteItem[];
  readonly labels: TeacherFutureScheduleLabels;
}

export interface SupportContactProps {
  readonly contact: SupportContactData | null;
  // NEW FOR PLAN v5: lifted `onContactAdmin` action + labels out of the
  // tier-side `supportContact.{mobile,desktop}.tsx` files per specs.md §3
  // N1 + N17 + §6.2 (mutations + `useNotifications`/toast side-effects live
  // in the ViewModel; the tier only receives the bound callback).
  readonly onContactAdmin: () => void;
  readonly supportContactLabel: string;
  readonly contactAdminLabel: string;
}

export interface FutureScheduleViewProps {
  readonly classes: readonly TeacherFutureScheduleQuery_teacherFutureSchedule_classes[];
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly onRequestLeave: (classInstanceId: string) => Promise<void>;
  readonly selectedDate: string;
  readonly onDateChange: (date: string) => void;
  readonly notes: readonly ImportantNoteItem[];
  readonly contact: SupportContactData | null;
}

export interface FutureScheduleContainerProps {
  readonly teacherId: string;
}
