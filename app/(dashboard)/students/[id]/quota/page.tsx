import { redirect } from "@/shared/i18n/routing";

export default async function StudentQuotaRedirectPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  redirect({ href: `/students/${id}/profile?tab=quota`, locale });
}
