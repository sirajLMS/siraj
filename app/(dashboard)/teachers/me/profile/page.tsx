import { redirect } from "@/shared/i18n/routing";
import { getServerUserContext } from "@/backend/lib";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";

export default async function TeacherMeProfileRedirectPage() {
  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  redirect({ href: "/profile" });
}
