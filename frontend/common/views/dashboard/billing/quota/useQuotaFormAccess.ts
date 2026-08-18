import { useContext } from "react";
import { QuotaFormAccessContext } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext";
import type { QuotaFormAccessContextValue } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types";

export function useQuotaFormAccess(): QuotaFormAccessContextValue {
  const value = useContext(QuotaFormAccessContext);
  if (value == null) {
    throw new Error("useQuotaFormAccess must be used within QuotaFormAccessProvider");
  }
  return value;
}
