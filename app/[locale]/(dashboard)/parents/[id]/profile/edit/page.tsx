import { getMessages } from "next-intl/server";
import ParentProfileEditContainer from "@/frontend/views/dashboard/parent/profile/edit/ParentProfileEditContainer";
import type { MessageSchema } from "@/shared/messages/types/message";

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
    title: `${messages.dashboard.parentProfile.actions.editProfile} | Siraj LMS`,
  };
}

export default async function ParentProfileEditPage({ params }: PageProps) {
  const { id } = await params;
  return <ParentProfileEditContainer id={id} />;
}
