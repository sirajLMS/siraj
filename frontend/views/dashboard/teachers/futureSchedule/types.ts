import type { FutureClass } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_importantNotes_TeacherImportantNote,
  TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_supportContact_SupportContact,
} from "@/frontend/graphql/generated/gql/operations";

export type ImportantNoteItem =
  TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_importantNotes_TeacherImportantNote;
export type SupportContactData =
  TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_supportContact_SupportContact;

export interface MiniCalendarDate {
  readonly num: number;
  readonly muted?: boolean;
  readonly active?: boolean;
  readonly selected?: boolean;
  readonly dot?: boolean;
}

export interface JumpToDateHeaderProps {
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly selectedDate: string;
  readonly onDateChange: (date: string) => void;
}

export interface FutureClassCardProps {
  readonly item: FutureClass;
  readonly onRequestLeave?: () => void;
  readonly onViewMaterials?: () => void;
}

export interface ImportantNotesProps {
  readonly notes: readonly ImportantNoteItem[];
}

export interface SupportContactProps {
  readonly contact: SupportContactData | null;
}

export interface FutureScheduleViewProps {
  readonly classes: readonly FutureClass[];
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly onRequestLeave: (classInstanceId: string) => Promise<void>;
  readonly selectedDate: string;
  readonly onDateChange: (date: string) => void;
  readonly notes: readonly ImportantNoteItem[];
  readonly contact: SupportContactData | null;
  readonly onViewMaterials: () => void;
}

export interface FutureScheduleContainerProps {
  readonly teacherId: string;
}
