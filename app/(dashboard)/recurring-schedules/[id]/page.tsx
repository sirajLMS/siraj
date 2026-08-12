import type { Metadata } from "next";
import { buildEntityNameOnlyTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getRecurringSchedulePageTitle } from "@/backend/lib/titles/cached-page-title";
import { RecurringScheduleDetailContainer } from "@/frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNameOnlyTranslatedMetadata(
    () => getRecurringSchedulePageTitle(id),
    t => t.commonTranslations.title
  );
}

export default withPageAuth([AppPermission.SCHEDULE_VIEW_ALL], async () => {
  return <RecurringScheduleDetailContainer />;
});
