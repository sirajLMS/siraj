import type { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Redirecting..." };
}

export default async function MeetingProvidersRedirectPage() {
  redirect("/payment-catalogs?tab=meetingProviders");
}
