import { redirect } from "next/navigation";
import type { ReactNode } from "react";

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

  // We verified access server-side.
  // Pass user info if we want, but currently DashboardLayoutContainer fetches via Apollo `useQuery(meQueryDocument)` client-side.
  return <DashboardLayoutContainer>{children}</DashboardLayoutContainer>;
}
