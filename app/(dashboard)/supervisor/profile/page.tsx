import { redirect } from "next/navigation";
import { getServerUserContext } from "@/backend/lib";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";

export default async function SupervisorProfileRedirectPage() {
  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  redirect("/profile");
}
