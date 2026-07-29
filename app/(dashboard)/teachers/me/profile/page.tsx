import { getServerUserContext } from "@/backend/lib";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { redirect } from "@/shared/i18n/routing";

export default async function TeacherMeProfileRedirectPage() {
  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  redirect({ href: "/profile" });
}
