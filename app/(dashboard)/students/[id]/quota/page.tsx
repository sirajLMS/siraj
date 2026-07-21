import { redirect } from "@/shared/i18n/routing";

export default async function StudentQuotaRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect({ href: `/students/${id}/profile?tab=quota` });
}
