"use client";

import { Button } from "@mui/material";
import {
  LifecycleFormBody,
  LifecycleParentSummaryCard,
} from "@/frontend/common/views/dashboard/parents/lifecycle/components/sharedViewContent";
import { useParentLifecycleProfileHref } from "@/frontend/common/views/dashboard/parents/lifecycle/components/useParentLifecycleForm";
import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { Link } from "@/shared/i18n";
import { useAppTranslation } from "@/shared/locale";

export function ParentLifecycleDesktopView({
  parent,
  isUpdating,
  onUpdateLifecycle,
}: Readonly<ParentLifecycleViewProps>) {
  const t = useAppTranslation().dashboardTranslations.parentLifecycle;
  const profileHref = useParentLifecycleProfileHref(parent);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        breadcrumbs={[
          { label: t.breadcrumbs.parents, href: "/parents" },
          { label: t.breadcrumbs.lifecycle, current: true },
        ]}
        actions={
          profileHref ? (
            <Button component={Link} href={profileHref} variant="outlined">
              {t.actions.viewProfile}
            </Button>
          ) : undefined
        }
      />

      <LifecycleParentSummaryCard parent={parent} size="lg" />

      <LifecycleFormBody parent={parent} isUpdating={isUpdating} onUpdateLifecycle={onUpdateLifecycle} />
    </DesktopPageContainer>
  );
}
