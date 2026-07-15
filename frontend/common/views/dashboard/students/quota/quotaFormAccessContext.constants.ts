import type { QuotaFormAccessContextValue } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext.types";

export const QuotaFormAccessContextDefaultValue: QuotaFormAccessContextValue = {
  readOnly: false,
  canEditIdentity: true,
  canEditQuota: true,
  canViewQuota: true,
  canViewTeacher: true,
};
