"use client";

import { ParentProfileSections } from "@/frontend/common/views/dashboard/profile/parent/parentProfileSections.parts";
import {
  ParentProfileGuardState,
  type ParentProfileSlotProps,
  ParentProfileTabRoutes,
} from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared.parts";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { ParentProfileSlotProps } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared.parts";

export function ParentProfileShared(
  viewModel: Readonly<ParentProfileViewModel> & { readonly slots: ParentProfileSlotProps }
) {
  const { labels, scope, activeTab, targetUserId, loading, error, parentData } = viewModel;
  const { base: t } = labels;
  const errorLabels = useAppTranslation(Translation.Errors);

  return (
    <ParentProfileTabRoutes activeTab={activeTab} scope={scope} targetUserId={targetUserId}>
      <ParentProfileGuardState
        loading={loading}
        error={error}
        hasParentData={Boolean(parentData)}
        failedToLoadMessage={t.errors.failedToLoad}
        retryLabel={t.actions.retry}
        notFoundMessage={t.errors.notFound}
        onRetry={viewModel.onRetry}
      >
        {parentData ? <ParentProfileSections viewModel={viewModel} errorLabels={errorLabels} /> : null}
      </ParentProfileGuardState>
    </ParentProfileTabRoutes>
  );
}
