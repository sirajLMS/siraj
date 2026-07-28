"use client";

import { Box, Button } from "@mui/material";
import {
  LifecycleFormBody,
  LifecycleParentSummaryCard,
} from "@/frontend/common/views/dashboard/parents/lifecycle/components/sharedViewContent";
import { useParentLifecycleProfileHref } from "@/frontend/common/views/dashboard/parents/lifecycle/components/useParentLifecycleForm";
import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { Link } from "@/shared/i18n";
import { useAppTranslation } from "@/shared/locale";

export function ParentLifecycleMobileView({
  parent,
  isUpdating,
  onUpdateLifecycle,
}: Readonly<ParentLifecycleViewProps>) {
  const t = useAppTranslation().dashboardTranslations.parentLifecycle;
  const profileHref = useParentLifecycleProfileHref(parent);

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={t.pageTitle}
        edgeToEdge={false}
        breadcrumbs={[
          { label: t.breadcrumbs.parents, href: "/parents" },
          { label: t.breadcrumbs.lifecycle, current: true },
        ]}
        actions={
          profileHref ? (
            <Button component={Link} href={profileHref} variant="outlined" size="small">
              {t.actions.viewProfile}
            </Button>
          ) : undefined
        }
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, md: 3 }, pb: 4 }}>
        <LifecycleParentSummaryCard parent={parent} size="sm" />
        <LifecycleFormBody parent={parent} isUpdating={isUpdating} onUpdateLifecycle={onUpdateLifecycle} />
      </Box>
    </MobilePageContainer>
  );
}
