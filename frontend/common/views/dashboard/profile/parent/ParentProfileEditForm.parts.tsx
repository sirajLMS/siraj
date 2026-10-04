"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import type {
  ParentAdminEditFormData,
  ParentEditData,
} from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/parent/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/parent/sections/AdminOnlySection";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/parent/sections/ContactSection";
import { IdentitySection } from "@/frontend/common/views/dashboard/profile/parent/sections/IdentitySection";
import {
  type ParentProfileViewLabels,
  toParentSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { SocialSection } from "@/frontend/common/views/dashboard/profile/parent/sections/SocialSection";
import type { ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

type ScopeContext = {
  readonly scope: ProfileScope;
  readonly isAdminScope: boolean;
  readonly canEdit: (group: ProfileFieldGroupKey) => boolean;
};

type ParentEditFormSectionsProps = {
  readonly parentData: ParentEditData;
  readonly targetUserId: string;
  readonly scopeContext: ScopeContext;
  readonly register: UseFormRegister<ParentAdminEditFormData>;
  readonly control: Control<ParentAdminEditFormData>;
  readonly labels: ParentProfileViewLabels;
};

export function ParentEditFormSections({
  parentData,
  targetUserId,
  scopeContext,
  register,
  control,
  labels,
}: ParentEditFormSectionsProps) {
  const { scope, isAdminScope, canEdit } = scopeContext;
  const sectionLabels = {
    parent: labels.parent,
    baseLabels: toParentSharedBaseLabels(labels.base),
  };
  const { parent: pt } = sectionLabels;

  return (
    <>
      {canEdit("core_identity") ? (
        <AccountSection
          mode="edit"
          labels={sectionLabels}
          scope={scope}
          parentData={{ name: parentData.name ?? null, email: parentData.email ?? null }}
          register={register}
          control={control}
        />
      ) : null}
      {canEdit("core_contact") ? (
        <ContactSection mode="edit" labels={sectionLabels} scope={scope} control={control} />
      ) : null}
      {canEdit("parent_social") ? (
        <SocialSection mode="edit" labels={pt} register={register} control={control} />
      ) : null}
      {canEdit("parent_identity") ? (
        <IdentitySection mode="edit" labels={pt} scope={scope} register={register} control={control} />
      ) : null}

      {isAdminScope ? (
        <>
          <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
          {canEdit("parent_billing") ? (
            <BillingSection mode="edit" labels={pt} register={register} control={control} />
          ) : null}
          {canEdit("parent_identity") ? (
            <AdminOnlySection labels={sectionLabels} mode="edit" register={register} />
          ) : null}
        </>
      ) : null}
    </>
  );
}
