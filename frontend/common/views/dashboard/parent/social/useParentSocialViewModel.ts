"use client";

import { useQuery } from "@apollo/client/react";
import { parentOwnProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-portal.documents";
import type { ParentSocialLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

interface ParentSocialProfileShape {
  readonly phone?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
}

export interface ParentSocialViewModel {
  readonly labels: ParentSocialLabels;
  readonly loading: boolean;
  readonly error: boolean;
  readonly profile: ParentSocialProfileShape | null;
}

export type UseParentSocialViewModelProps = Record<string, never>;

export function useParentSocialViewModel(_props: Readonly<UseParentSocialViewModelProps>): ParentSocialViewModel {
  const labels = useAppTranslation().dashboardTranslations.parentSocial;
  const { data, loading, error } = useQuery(parentOwnProfileQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const profile = data?.parentOwnProfile
    ? {
        phone: data.parentOwnProfile.phone,
        facebook: data.parentOwnProfile.facebook,
        whatsapp: data.parentOwnProfile.whatsapp,
        twitter: data.parentOwnProfile.twitter,
      }
    : null;

  return { labels, loading, error: !!error, profile };
}
