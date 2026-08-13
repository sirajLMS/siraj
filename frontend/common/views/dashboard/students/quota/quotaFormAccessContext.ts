import { createContext, useContext } from "react";
import { QuotaFormAccessContextDefaultValue } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext.constants";
import type { QuotaFormAccessContextValue } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext.types";

export const QuotaFormAccessContext = createContext<QuotaFormAccessContextValue | null>(
  QuotaFormAccessContextDefaultValue
);

export function useQuotaFormAccess(): QuotaFormAccessContextValue {
  const value = useContext(QuotaFormAccessContext);
  if (value?.labels == null || value.commonLabels == null) {
    throw new Error("useQuotaFormAccess must be used within QuotaFormAccessProvider");
  }
  return value;
}
