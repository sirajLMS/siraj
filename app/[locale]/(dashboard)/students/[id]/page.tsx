import { redirect } from "@/shared/i18n/routing";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  redirect({ href: `/students/${id}/status`, locale });
}
