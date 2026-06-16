import { getMessages } from "next-intl/server";
import type { MessageSchema } from "@/frontend/messages/types/message";
import ParentProfileContainer from "@/frontend/views/dashboard/parents/profile/ParentProfileContainer";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
    readonly locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const messages = (await getMessages({ locale })) as unknown as MessageSchema;
  return {
    title: `${messages.dashboard.parentProfile.pageTitle} | Siraj LMS`,
  };
}

export default async function ParentProfilePage({ params }: PageProps) {
  const { id } = await params;
  return <ParentProfileContainer id={id} />;
}
