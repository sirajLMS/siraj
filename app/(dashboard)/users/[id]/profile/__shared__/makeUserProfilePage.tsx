import type { Metadata } from "next";
import type { ReactElement } from "react";

import { buildEntityNamePrefixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import type { ProfileMode } from "@/backend/enum";
import { getUserPageTitle } from "@/backend/lib/titles/cached-page-title";
import { ProfilePageServer } from "@/frontend/common/views/dashboard/profile/__shared__/profilePageServer";

export interface UserProfilePageProps {
  readonly params: Promise<{ readonly id: string }>;
}

type ProfileTitleKey = "pageTitle" | "editTitle";

/**
 * Returns a `generateMetadata` export for user profile pages.
 *
 * @param titleKey — `"pageTitle"` for view mode, `"editTitle"` for edit mode.
 */
export function makeUserProfilePageMetadata(titleKey: ProfileTitleKey) {
  return async function generateUserProfilePageMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
    const { id } = await params;
    return buildEntityNamePrefixedTranslatedMetadata(
      () => getUserPageTitle(id),
      t => t.profileTranslations.base[titleKey]
    );
  };
}

/**
 * Returns a default-export page component for user profile pages.
 *
 * @param mode — `ProfileMode.VIEW` or `ProfileMode.EDIT`.
 */
export function makeUserProfilePageComponent(mode: ProfileMode) {
  return async function UserProfilePage({ params }: UserProfilePageProps): Promise<ReactElement> {
    const { id } = await params;
    return <ProfilePageServer mode={mode} targetUserId={id} />;
  };
}
