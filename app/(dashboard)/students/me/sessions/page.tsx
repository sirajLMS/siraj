import { redirect } from "@/shared/i18n/routing";

export default function StudentMeSessionsRedirectPage() {
  redirect({ href: "/students/sessions" });
}
