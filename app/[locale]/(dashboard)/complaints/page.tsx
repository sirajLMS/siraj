import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCachedParentIdForComplaints } from "@/backend/lib/auth/cached-parent";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentComplaintsContainer } from "@/frontend/common/views/dashboard/complaints/ParentComplaintsContainer";
import { redirect } from "@/shared/i18n/routing";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.complaints.parent" });
  return { title: t("pageTitle") };
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
