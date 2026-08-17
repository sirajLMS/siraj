import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext";
import type { QuotaFormInput } from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import type { UseQuotaFormViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel";

export interface QuotaFormShell {
  readonly pageTitle: string;
  readonly breadcrumbs: { readonly label: string; readonly href?: string; readonly current?: boolean }[];
  readonly periodType: QuotaFormInput["periodType"];
  readonly kind: QuotaFormInput["kind"];
  readonly canManage: boolean;
}

export function useQuotaFormShell(props: Readonly<UseQuotaFormViewModel>): QuotaFormShell {
  const { form, labels, isEditing } = props;
  const pageTitle = isEditing ? labels.editQuota : labels.newQuota;
  const breadcrumbs = [
    { label: labels.title, href: "/quotas" },
    { label: pageTitle, current: true },
  ];
  const periodType = form.watch("periodType");
  const kind = form.watch("kind");
  const { canManage } = useQuotaFormAccess();
  return { pageTitle, breadcrumbs, periodType, kind, canManage };
}
