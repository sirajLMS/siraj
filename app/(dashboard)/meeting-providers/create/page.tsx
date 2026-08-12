import { buildMeetingProviderPageMetadata } from "@/app/(dashboard)/meeting-providers/__shared__/buildMeetingProviderPageMetadata";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { MeetingProviderFormContainer } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormContainer";

export const generateMetadata = buildMeetingProviderPageMetadata("create");

export default withPageAuth([AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG], async () => {
  return <MeetingProviderFormContainer mode="create" />;
});
