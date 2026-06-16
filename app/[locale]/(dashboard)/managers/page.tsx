import { setRequestLocale } from "next-intl/server";
import { ManagersContainer } from "@/frontend/views/dashboard/managers/home/ManagersContainer";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ManagersPage({ params }: Readonly<Props>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ManagersContainer />;
}
