import { redirect } from "@/shared/i18n/routing";

export default function TeacherMeClassesRedirectPage() {
  redirect({ href: "/classes" });
}
