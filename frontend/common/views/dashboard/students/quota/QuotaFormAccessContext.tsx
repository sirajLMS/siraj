"use client";

import { createContext, useContext } from "react";

type QuotaFormAccessContextValue = {
  readonly readOnly: boolean;
  readonly canEditIdentity: boolean;
  readonly canEditQuota: boolean;
  readonly canViewQuota: boolean;
  readonly canViewTeacher: boolean;
};

const QuotaFormAccessContext = createContext<QuotaFormAccessContextValue>({
  readOnly: false,
  canEditIdentity: true,
  canEditQuota: true,
  canViewQuota: true,
  canViewTeacher: true,
});

export function QuotaFormAccessProvider({
  value,
  children,
}: {
  readonly value: QuotaFormAccessContextValue;
  readonly children: React.ReactNode;
}) {
  return <QuotaFormAccessContext.Provider value={value}>{children}</QuotaFormAccessContext.Provider>;
}

export function useQuotaFormAccess(): QuotaFormAccessContextValue {
  return useContext(QuotaFormAccessContext);
}
