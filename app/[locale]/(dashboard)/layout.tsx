import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { DashboardLayoutContainer } from "@/frontend/views/dashboard/components/DashboardLayoutContainer";

export default async function DashboardLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { userId, context } = await getServerUserContext();
  const { locale } = await params;

  if (!userId || !context) {
    redirect(`/${locale}/login`);
  }

  const userProfile = await getCurrentUser(userId);

  return <DashboardLayoutContainer userProfile={userProfile}>{children}</DashboardLayoutContainer>;
}
