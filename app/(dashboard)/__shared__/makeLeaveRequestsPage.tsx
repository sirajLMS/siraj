import type { Metadata } from "next";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { LeaveRequestsContainer } from "@/frontend/common/views/dashboard/scheduling/leave-requests/LeaveRequestsContainer";

export const generateLeaveRequestsMetadata = (): Promise<Metadata> =>
  buildTranslatedMetadata(t => t.dashboardTranslations.selfServiceReschedule.requestsList.title);

export const createLeaveRequestsPageComponent = () =>
  withPageAuth([AppPermission.SESSION_SELF_DELAY], () => <LeaveRequestsContainer />);
