import type { QuotaFormAccessContextValue } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext.types";

export const QuotaFormAccessContextDefaultValue = {
  readOnly: false,
  canEditIdentity: true,
  canEditQuota: true,
  canViewQuota: true,
  canViewTeacher: true,
} as QuotaFormAccessContextValue;
