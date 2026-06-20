import { UserBillingProfileView } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileView";

interface BillingProfilePageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function BillingProfilePage({ params }: Readonly<BillingProfilePageProps>) {
  const { id } = await params;
  return <UserBillingProfileView userId={id} />;
}
