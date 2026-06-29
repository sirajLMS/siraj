import { redirect } from "next/navigation";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  redirect(`/${locale}/students/${id}/status`);
}
