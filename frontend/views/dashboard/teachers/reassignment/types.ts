import type { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { StudentAccountStatus } from "../../admin/parents/students/types";

export interface TeacherReassignmentViewProps {
  readonly student: ReassignmentStudentData;
  readonly currentTeacherName: string;
  readonly teachers: readonly ReassignmentTeacherOption[];
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
  readonly teachers: readonly ReassignmentTeacherOption[];
  readonly currentStatus: StudentStatus;
  readonly studentId: string;
  readonly version: number | null;
  readonly isSubmitting: boolean;
  readonly onReassign: (input: ReassignmentSubmitInput) => Promise<void>;
  readonly onStatusChange: (input: StatusChangeInput) => Promise<void>;
  readonly onCancel: () => void;
}

export interface StudentContextCardProps {
  readonly student: ReassignmentStudentData;
}

export interface CurrentTeacherCardProps {
  readonly currentTeacherName: string;
  readonly teacherId?: string;
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
}
