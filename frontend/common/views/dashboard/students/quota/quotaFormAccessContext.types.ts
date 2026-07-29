import type { CommonLabels } from "@/shared/locale";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export interface QuotaFormAccessContextValue {
  readonly readOnly: boolean;
  readonly canEditIdentity: boolean;
  readonly canEditQuota: boolean;
  readonly canViewQuota: boolean;
  readonly canViewTeacher: boolean;
  readonly labels: StudentQuotaLabels;
  readonly commonLabels: CommonLabels;
}
