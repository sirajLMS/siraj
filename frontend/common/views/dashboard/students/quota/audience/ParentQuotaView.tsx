"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { type ReactElement, useState } from "react";
import { UserAvatar } from "@/frontend/common/components/ui/avatar";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth";
import { parentAssociatedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import { QuotaAudienceContent } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceContent";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface ParentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

interface ChildQuotaContentProps {
  readonly studentId: string;
  readonly t: StudentQuotaLabels;
}

function ChildQuotaContent({ studentId, t }: Readonly<ChildQuotaContentProps>): ReactElement {
  return <QuotaAudienceContent studentId={studentId} t={t} />;
}

export function ParentQuotaView({ t }: Readonly<ParentQuotaViewProps>): ReactElement {
  const user = useUserStore(s => s.user);
  const parentIdFromStore = user?.parentId ?? "";

  const { data: meData } = useQuery(meQueryDocument, { skip: parentIdFromStore !== "" });
  const parentId = parentIdFromStore || (meData?.me?.parentId ?? "");

  const { data: childrenData, loading: loadingChildren } = useQuery(parentAssociatedStudentsQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const children = childrenData?.parentAssociatedStudents ?? [];
  const [selectedTab, setSelectedTab] = useState(0);

  if (!parentId) {
    logger.warn("ParentQuotaView: No parent ID available");
    return <QuotaEmptyState message={t.audience.selectChildPrompt} />;
  }

  if (loadingChildren) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (children.length === 0) {
    return <QuotaEmptyState message={t.audience.noChildren} />;
  }

  const safeTabIndex = Math.min(selectedTab, children.length - 1);
  const selectedChild = children[safeTabIndex];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="titleLg">{t.audience.parentTitle}</Typography>
      <Tabs value={safeTabIndex} onChange={(_, v) => setSelectedTab(v)} variant="scrollable" scrollButtons="auto">
        {children.map(child => (
          <Tab
            key={child.id ?? ""}
            icon={<UserAvatar src={child.avatarUrl} label={child.name ?? t.common.notSet} size={28} />}
            iconPosition="start"
            label={child.name ?? t.common.notSet}
          />
        ))}
      </Tabs>
      {selectedChild?.id != null ? (
        <Stack sx={{ gap: 2 }}>
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
            <UserAvatar src={selectedChild.avatarUrl} label={selectedChild.name ?? t.common.notSet} size={48} />
            <Typography variant="titleLg">{selectedChild.name ?? t.common.notSet}</Typography>
          </Stack>
          <ChildQuotaContent studentId={selectedChild.id} t={t} />
        </Stack>
      ) : (
        <QuotaEmptyState message={t.audience.noChildren} />
      )}
    </Box>
  );
}
