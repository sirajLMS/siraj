import { createContext, useContext } from "react";
import { QuotaFormAccessContextDefaultValue } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext.constants";
import type { QuotaFormAccessContextValue } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext.types";

export const QuotaFormAccessContext = createContext<QuotaFormAccessContextValue>(QuotaFormAccessContextDefaultValue);

export function useQuotaFormAccess(): QuotaFormAccessContextValue {
  return useContext(QuotaFormAccessContext);
}
