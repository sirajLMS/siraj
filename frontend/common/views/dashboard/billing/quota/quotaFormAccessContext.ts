import { createContext } from "react";
import { QuotaFormAccessContextDefaultValue } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.constants";
import type { QuotaFormAccessContextValue } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types";

export const QuotaFormAccessContext = createContext<QuotaFormAccessContextValue | null>(
  QuotaFormAccessContextDefaultValue
);
