import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { PaymentCatalogAdminContainer } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.paymentCatalogs;
  return { title: t.pageTitle };
}

export default async function PaymentCatalogsPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}) {
  const { locale: _locale } = await params;

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin();
    return;
  }

  return <PaymentCatalogAdminContainer />;
}
