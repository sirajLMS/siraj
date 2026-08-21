"use client";

import { type ReactNode, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { QuotaFormAccessContext } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext";
import type {
  QuotaFormAccessContextValue,
  QuotaFormFieldAccess,
} from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface QuotaFormAccessProviderProps {
  readonly labels: QuotaLabels;
  readonly children: ReactNode;
}

export function QuotaFormAccessProvider({ labels, children }: Readonly<QuotaFormAccessProviderProps>) {
  const hasPermission = useUserStore(s => s.hasPermission);

  const canManage = hasPermission(AppPermission.QuotasManage);
  const canView = hasPermission(AppPermission.QuotasView);
  const readOnly = !canManage && canView;

  const value = useMemo<QuotaFormAccessContextValue>(() => {
    const restrictedField = {
      disabled: !canManage,
      helperText: readOnly ? labels.restrictedAccessHelperText : null,
    } as const;

    const unrestrictedField = { disabled: false, helperText: null } as const;

    const fieldAccess: QuotaFormFieldAccess = {
      studentId: canManage ? unrestrictedField : restrictedField,
      name: unrestrictedField,
      kind: canManage ? unrestrictedField : restrictedField,
      totalClasses: canManage ? unrestrictedField : restrictedField,
      priority: canManage ? unrestrictedField : restrictedField,
      validFrom: canManage ? unrestrictedField : restrictedField,
      validUntil: canManage ? unrestrictedField : restrictedField,
      periodType: canManage ? unrestrictedField : restrictedField,
      periodDays: canManage ? unrestrictedField : restrictedField,
    };

    return { readOnly, canManage, canView, fieldAccess, labels };
  }, [canManage, canView, readOnly, labels]);

  return <QuotaFormAccessContext.Provider value={value}>{children}</QuotaFormAccessContext.Provider>;
}
