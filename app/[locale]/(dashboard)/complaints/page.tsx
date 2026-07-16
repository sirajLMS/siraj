import type { Metadata } from "next";
import { getCachedParentIdForComplaints } from "@/backend/lib/auth/cached-parent";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentComplaintsContainer } from "@/frontend/common/views/dashboard/complaints/ParentComplaintsContainer";
import { redirect } from "@/shared/i18n/routing";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.complaints;
  return { title: t.parent.pageTitle };
}

export default async function ComplaintsPage({ params }: { readonly params: Promise<{ locale: string }> }) {
  const { userId } = await getServerUserContext();
  const { locale } = await params;

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  let parentId: string | null = null;
  try {
    parentId = await getCachedParentIdForComplaints(userId, locale);
  } catch (error) {
    logger.warn("Failed to retrieve parent ID for complaints page. Redirecting to home dashboard.", { error });
    redirect({ href: "/", locale });
  }

  return <ParentComplaintsContainer parentId={parentId ?? ""} />;
}
