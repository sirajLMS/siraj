import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentAccountStatus } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment";

export interface TeacherReassignmentViewProps {
  readonly student: ReassignmentStudentData;
  readonly currentTeacherName: string;
  readonly isSubmitting: boolean;
  readonly onReassign: (input: ReassignmentSubmitInput) => Promise<void>;
  readonly onStatusChange: (input: StatusChangeInput) => Promise<void>;
  readonly onCancel: () => void;
}

export interface ReassignmentStudentData {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly accountStatus: StudentAccountStatus;
  readonly status: StudentStatus;
  readonly primaryTeacherId: string | null;
  readonly teacherName: string | null;
  readonly version: number | null;
  readonly updatedAt: string | null;
}

export interface ReassignmentTeacherOption {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly status: "active" | "offline";
}

export interface ReassignmentSubmitInput {
  readonly studentId: string;
  readonly newTeacherId: string;
  readonly expectedVersion?: number;
}

export interface StatusChangeInput {
  readonly studentId: string;
  readonly newStatus: StudentStatus;
  readonly expectedVersion?: number;
}

export interface ManagementControlsCardProps {
  readonly currentStatus: StudentStatus;
  readonly studentId: string;
  readonly version: number | null;
  readonly isSubmitting: boolean;
  readonly onReassign: (input: ReassignmentSubmitInput) => Promise<void>;
  readonly onStatusChange: (input: StatusChangeInput) => Promise<void>;
  readonly onCancel: () => void;
  // NEW FOR PLAN v5: form state + actions previously held in tier useState/useNotifications/setTimeout
  // (specs.md §3 N7, N17, N18). Lifted into the ViewModel so the tier component stays pure-render.
  readonly selectedTeacherId: string;
  readonly selectedNewStatus: StudentStatus | "";
  readonly saved: boolean;
  readonly onSelectedTeacherIdChange: (id: string) => void;
  readonly onSelectedNewStatusChange: (status: StudentStatus | "") => void;
  readonly onSubmitForm: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
  readonly labels: Pick<TeacherReassignmentLabels, "controls" | "actions">;
  readonly statusLabelId: string;
}

export interface StudentContextCardProps {
  readonly student: ReassignmentStudentData;
  readonly labels: TeacherReassignmentLabels["studentContext"];
}

export interface CurrentTeacherCardProps {
  readonly currentTeacherName: string;
  readonly teacherId?: string;
  readonly labels: TeacherReassignmentLabels["currentTeacher"];
}

export interface BentoCardProps {
  readonly icon: React.ComponentType;
  readonly title: string;
  readonly subtitle: string;
  readonly onClick?: () => void;
}

export interface ReassignmentBentoGridProps {
  readonly studentId: string;
  readonly lastUpdated: string | null;
  readonly pendingNotificationCount: number;
  // NEW FOR PLAN v5: navigation + notification actions previously invoked via tier
  // useRouter/useNotifications (specs.md §3 N8, N17). Lifted into the ViewModel.
  readonly onOpenChangeHistory: () => void;
  readonly onOpenParentContact: () => void;
  readonly labels: TeacherReassignmentLabels["historyAndContact"];
}
