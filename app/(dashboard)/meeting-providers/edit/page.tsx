import { buildMeetingProviderPageMetadata } from "@/app/(dashboard)/meeting-providers/__shared__/buildMeetingProviderPageMetadata";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { MeetingProviderFormContainer } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormContainer";

export const generateMetadata = buildMeetingProviderPageMetadata("edit");

export default withPageAuth<{ readonly searchParams: Promise<{ readonly id?: string }> }>(
  [AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG],
  async (_auth, { searchParams }) => {
    const resolvedSearchParams = await searchParams;
    return <MeetingProviderFormContainer mode="edit" providerId={resolvedSearchParams.id ?? null} />;
  }
);
