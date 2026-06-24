import { redirect } from "next/navigation";
import { getCachedParentIdForComplaints } from "@/backend/lib/auth/cached-parent";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { ParentComplaintsContainer } from "@/frontend/views/dashboard/complaints/ParentComplaintsContainer";

export default async function ComplaintsPage({ params }: { readonly params: Promise<{ locale: string }> }) {
  const { userId } = await getServerUserContext();
  const { locale } = await params;

  if (!userId) {
    redirect(`/${locale}/login`);
  }

  let parentId: string | null = null;
  try {
    parentId = await getCachedParentIdForComplaints(userId, locale);
  } catch (error) {
    logger.warn("Failed to retrieve parent ID for complaints page. Redirecting to home dashboard.", { error });
    // If user lacks permission or is not a parent, redirect to dashboard home
    redirect(`/${locale}`);
  }

  return <ParentComplaintsContainer parentId={parentId ?? ""} />;
}
