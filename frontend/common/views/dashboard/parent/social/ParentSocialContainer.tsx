"use client";

import { useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentOwnProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { ParentSocialView } from "@/frontend/common/views/dashboard/parent/social/parentSocialView";
import { useAppTranslation } from "@/shared/locale";

export function ParentSocialContainer() {
  const t = useAppTranslation().dashboardTranslations.parentSocial;
  const { data, loading, error } = useQuery(parentOwnProfileQueryDocument);
  const profile = data?.parentOwnProfile
    ? {
        phone: data.parentOwnProfile.phone,
        facebook: data.parentOwnProfile.facebook,
        whatsapp: data.parentOwnProfile.whatsapp,
        twitter: data.parentOwnProfile.twitter,
      }
    : null;

  return (
    <RequirePermission permissions={[AppPermission.ParentViewOwnProfile]}>
      <ParentSocialView labels={t} loading={loading} error={Boolean(error)} profile={profile} />
    </RequirePermission>
  );
}
