import { redirect } from "@/shared/i18n/routing";

export default async function StudentStatusRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect({ href: `/students/${id}/profile?tab=status` });
}
