"use client";

import type * as React from "react";
import { QuotaFormAccessContext } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext";
import type { QuotaFormAccessContextValue } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext.types";

export function QuotaFormAccessProvider({
  value,
  children,
}: {
  readonly value: QuotaFormAccessContextValue;
  readonly children: React.ReactNode;
}) {
  return <QuotaFormAccessContext.Provider value={value}>{children}</QuotaFormAccessContext.Provider>;
}
