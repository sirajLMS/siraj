import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { PaymentCatalogAdminContainer } from "@/frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminContainer";

export default async function PaymentCatalogsPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <PaymentCatalogAdminContainer />;
}
