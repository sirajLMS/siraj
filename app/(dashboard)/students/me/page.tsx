import { redirect } from "@/shared/i18n/routing";

export default function StudentMeRedirectPage() {
  redirect({ href: "/dashboard" });
}
