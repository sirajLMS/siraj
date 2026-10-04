import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  StudentProfileContextValue,
  StudentProfileQueryData,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import type { StudentProfilePageLabelsBySection } from "@/frontend/common/views/dashboard/students/profile/types/studentProfilePage.types";
import type { StudentStatusLabels } from "@/shared/locale";
import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile";

export interface StudentProfileHeaderValues {
  readonly title: string;
  readonly subtitle: string;
}

export interface StudentProfileStatusBadge {
  readonly category: "studentAccount";
  readonly status: string;
  readonly label: string;
}

export type StudentProfileLoadingState = "loading" | "notFound" | "ready";

export function buildStudentStatusLabel(tStatus: StudentStatusLabels): Record<StudentStatus, string> {
  return {
    [StudentStatus.Regular]: tStatus.statusOptions.REGULAR,
    [StudentStatus.Suspended]: tStatus.statusOptions.SUSPENDED,
    [StudentStatus.OnLeave]: tStatus.statusOptions.ON_LEAVE,
    [StudentStatus.OnTrial]: tStatus.statusOptions.ON_TRIAL,
    [StudentStatus.Deactivated]: tStatus.statusOptions.DEACTIVATED,
  };
}

export function buildStudentProfileContextValue(
  studentId: string,
  profile: StudentProfileQueryData | undefined,
  loading: boolean,
  refetch: StudentProfileContextValue["refetch"]
): StudentProfileContextValue {
  return {
    studentId,
    profile: profile ?? null,
    loading,
    refetch,
  };
}

export function buildStudentProfileLabelsBySection(t: StudentProfileLabels): StudentProfilePageLabelsBySection {
  return {
    shell: {
      title: t.title,
      loading: t.loading,
      notFoundTitle: t.notFoundTitle,
      notFoundDescription: t.notFoundDescription,
    },
    tabs: t.tabs,
  };
}
