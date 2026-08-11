import type { Metadata } from "next";
import { buildEntityNamePrefixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { ProfileMode } from "@/backend/enum";
import { getUserPageTitle } from "@/backend/lib/titles/cached-page-title";
import { ProfilePageServer } from "@/frontend/common/views/dashboard/profile/__shared__/profilePageServer";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNamePrefixedTranslatedMetadata(
    () => getUserPageTitle(id),
    t => t.profileTranslations.base.pageTitle
  );
}

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  return <ProfilePageServer mode={ProfileMode.VIEW} targetUserId={id} />;
}
