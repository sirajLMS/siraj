import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { redirect } from "@/shared/i18n/routing";

export default withPageAuth<{ params: Promise<{ id: string }> }>(
  [AppPermission.QUOTAS_VIEW],
  async (_auth, { params }) => {
    const { id } = await params;
    redirect({ href: `/students/${id}/profile?tab=quota` });
    return undefined;
  }
);
