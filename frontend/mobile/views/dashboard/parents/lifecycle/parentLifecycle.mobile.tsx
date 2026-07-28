"use client";

import { Box, Button } from "@mui/material";
import {
  LifecycleFormBody,
  LifecycleParentSummaryCard,
} from "@/frontend/common/views/dashboard/parents/lifecycle/components/sharedViewContent";
import { useParentLifecycleProfileHref } from "@/frontend/common/views/dashboard/parents/lifecycle/components/useParentLifecycleForm";
import type { ParentLifecycleViewModel } from "@/frontend/common/views/dashboard/parents/lifecycle/useParentLifecycleViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { Link } from "@/shared/i18n";

export function ParentLifecycleMobileView({
  labels,
  parent,
  isUpdating,
  onUpdateLifecycle,
}: Readonly<ParentLifecycleViewModel>) {
  const profileHref = useParentLifecycleProfileHref(parent);

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.pageTitle}
        edgeToEdge={false}
        breadcrumbs={[
          { label: labels.breadcrumbs.parents, href: "/parents" },
          { label: labels.breadcrumbs.lifecycle, current: true },
        ]}
        actions={
          profileHref ? (
            <Button component={Link} href={profileHref} variant="outlined" size="small">
              {labels.actions.viewProfile}
            </Button>
          ) : undefined
        }
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, md: 3 }, pb: 4 }}>
        <LifecycleParentSummaryCard parent={parent} labels={labels} size="sm" />
        <LifecycleFormBody
          parent={parent}
          labels={labels}
          isUpdating={isUpdating}
          onUpdateLifecycle={onUpdateLifecycle}
        />
      </Box>
    </MobilePageContainer>
  );
}
