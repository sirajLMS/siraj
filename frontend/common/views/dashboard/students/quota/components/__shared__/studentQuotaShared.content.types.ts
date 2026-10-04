import type { StudentQuotaTierConfig } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.types";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import type { StudentQuotaViewModel } from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";

type QuotaViewModelPick = Pick<
  StudentQuotaViewModel,
  | "t"
  | "tc"
  | "methods"
  | "onSubmit"
  | "isSaving"
  | "isSaved"
  | "readOnly"
  | "embedded"
  | "onCancel"
  | "canEditIdentity"
  | "canEditQuota"
  | "canViewQuota"
  | "canViewTeacher"
>;

export interface StudentQuotaContentSharedProps extends QuotaViewModelPick {
  readonly studentData: StudentProfileData | null;
  readonly tier: StudentQuotaTierConfig;
}
