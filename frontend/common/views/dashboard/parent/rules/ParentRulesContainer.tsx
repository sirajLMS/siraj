"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { ParentRulesView } from "@/frontend/common/views/dashboard/parent/rules/parentRulesView";
import { useAppTranslation } from "@/shared/locale";

export function ParentRulesContainer() {
  const t = useAppTranslation().dashboardTranslations.parentRules;
  const [handbookRequested, setHandbookRequested] = useState(false);
  const { data: handbookData, loading: handbookLoading } = useQuery(parentHandbookUrlQueryDocument, {
    skip: !handbookRequested,
  });

  useEffect(() => {
    if (handbookRequested && !handbookLoading) {
      if (handbookData?.parentHandbookUrl?.url) {
        globalThis.open(handbookData.parentHandbookUrl.url, "_blank");
      }
      setHandbookRequested(false);
    }
  }, [handbookRequested, handbookLoading, handbookData]);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewFamily]}>
      <ParentRulesView
        labels={t}
        handbookLoading={handbookLoading}
        onDownloadHandbook={() => setHandbookRequested(true)}
      />
    </RequirePermission>
  );
}
