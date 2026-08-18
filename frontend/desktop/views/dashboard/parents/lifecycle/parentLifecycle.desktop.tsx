"use client";

import { Button } from "@mui/material";
import {
  LifecycleFormBody,
  LifecycleParentSummaryCard,
} from "@/frontend/common/views/dashboard/parents/lifecycle/components/sharedViewContent";
import { useParentLifecycleProfileHref } from "@/frontend/common/views/dashboard/parents/lifecycle/components/useParentLifecycleForm";
import type { ParentLifecycleViewModel } from "@/frontend/common/views/dashboard/parents/lifecycle/useParentLifecycleViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { Link } from "@/shared/i18n";

export function ParentLifecycleDesktopView({
  labels,
  parent,
  isUpdating,
  onUpdateLifecycle,
}: Readonly<ParentLifecycleViewModel>) {
  const profileHref = useParentLifecycleProfileHref(parent);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        breadcrumbs={[
          { label: labels.breadcrumbs.parents, href: "/parents" },
          { label: labels.breadcrumbs.lifecycle, current: true },
        ]}
        actions={
          profileHref ? (
            <Link href={profileHref} style={{ textDecoration: "none" }}>
              <Button variant="outlined">{labels.actions.viewProfile}</Button>
            </Link>
          ) : undefined
        }
      />

      <LifecycleParentSummaryCard parent={parent} labels={labels} size="lg" />

      <LifecycleFormBody
        parent={parent}
        labels={labels}
        isUpdating={isUpdating}
        onUpdateLifecycle={onUpdateLifecycle}
      />
    </DesktopPageContainer>
  );
}
