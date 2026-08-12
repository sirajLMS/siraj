import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { redirect } from "@/shared/i18n/routing";

export default withPageAuth(null, async () => {
  redirect({ href: "/profile" });
});
