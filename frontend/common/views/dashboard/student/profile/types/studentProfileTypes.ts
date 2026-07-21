import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";

export interface StudentProfileRow {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly avatarUrl: string | null;
  readonly dateOfBirth: string | null;
  readonly gender: string | null;
  readonly language: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly parentId: string | null;
  readonly parentUserId: string | null;
  readonly parentName: string | null;
  readonly parentEmail: string | null;
  readonly parentPhone: string | null;
  readonly isAssociatedViewer: boolean;
  readonly primaryTeacherId: string | null;
  readonly teacherUserId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: number | null;
  readonly classesRemaining: number | null;
  readonly classesTotal: number | null;
  readonly version: number;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

// Mobile tier presentation prop types (sub-components defined in
// `frontend/mobile/views/dashboard/student/profile/studentProfile.mobile.tsx`).

export type AcademicMetricsGridProps = Readonly<{
  readonly title: string;
  readonly profile: StudentProfileViewModel["profile"];
  readonly labels: StudentProfileViewModel["labels"];
}>;

export type PersonalInfoSectionProps = Readonly<{
  readonly title: string;
  readonly profile: StudentProfileViewModel["profile"];
  readonly draft: StudentProfileViewModel["draft"];
  readonly labels: StudentProfileViewModel["labels"];
  readonly isEditing: boolean;
  readonly formattedDateOfBirth: StudentProfileViewModel["formattedDateOfBirth"];
  readonly onDraftChange: StudentProfileViewModel["onDraftChange"];
}>;

export type ParentInfoSectionProps = Readonly<{
  readonly title: string;
  readonly profile: StudentProfileViewModel["profile"];
  readonly draft: StudentProfileViewModel["draft"];
  readonly labels: StudentProfileViewModel["labels"];
  readonly isEditing: boolean;
  readonly onDraftChange: StudentProfileViewModel["onDraftChange"];
}>;

export type ProfileActionsProps = Readonly<{
  readonly isEditing: boolean;
  readonly saving: boolean;
  readonly labels: StudentProfileViewModel["labels"];
  readonly onCancelEdit: StudentProfileViewModel["onCancelEdit"];
  readonly onSave: StudentProfileViewModel["onSave"];
  readonly onBackToDashboard: StudentProfileViewModel["onBackToDashboard"];
}>;

export type ProfileSnackbarProps = Readonly<{
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error";
  readonly onSnackbarClose: StudentProfileViewModel["onSnackbarClose"];
}>;
