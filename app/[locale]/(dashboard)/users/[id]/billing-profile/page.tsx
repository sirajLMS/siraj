import { getMessages } from "next-intl/server";
import { UserBillingProfileContainer } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer";
import type { MessageSchema } from "@/shared/messages/types/message";

interface BillingProfilePageProps {
  readonly params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: BillingProfilePageProps) {
  const { locale } = await params;
  const messages = (await getMessages({ locale })) as unknown as MessageSchema;
  return {
    title: `${messages.dashboard.billing.billingProfileTitle} | Siraj LMS`,
  };
}

export default async function BillingProfilePage({ params }: Readonly<BillingProfilePageProps>) {
  const { id } = await params;
  return <UserBillingProfileContainer userId={id} />;
}
