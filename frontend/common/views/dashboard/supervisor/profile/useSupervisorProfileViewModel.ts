"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { type SupervisorPortalProfileLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface SupervisorProfileData {
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly status: string | null;
  readonly roleName: string | null;
  readonly avatarUrl: string | null;
}

export interface SupervisorProfileViewModel {
  readonly labels: SupervisorPortalProfileLabels;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly profile: SupervisorProfileData | null;
}

export interface UseSupervisorProfileViewModelProps {
  readonly targetUserId: string;
}

export function useSupervisorProfileViewModel(
  props: Readonly<UseSupervisorProfileViewModelProps>
): SupervisorProfileViewModel {
  const labels = useAppTranslation(Translation.Dashboard.SupervisorPortalProfile);
  const { targetUserId } = props;

  useDocumentTitle("", Translation.Dashboard.SupervisorPortalProfile, "pageTitle");

  const { data, loading, error } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    skip: !targetUserId,
    fetchPolicy: "cache-and-network",
  });

  const profile = useMemo((): SupervisorProfileData | null => {
    const staff = data?.profileByUserId?.staffProfile;
    if (!staff) return null;
    return {
      name: staff.name ?? data?.profileByUserId?.name ?? "",
      email: staff.email ?? data?.profileByUserId?.email ?? null,
      phone: staff.phone ?? null,
      status: staff.status ?? null,
      roleName: staff.roleName ?? staff.roleSlug ?? null,
      avatarUrl: staff.avatarUrl ?? data?.profileByUserId?.avatarUrl ?? null,
    };
  }, [data]);

  return {
    labels,
    loading,
    error,
    profile,
  };
}
