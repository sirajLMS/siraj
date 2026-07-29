import type { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Redirecting..." };
}

export default async function InvoicesRedirectPage() {
  // This route is the parent landing page for parents - it should redirect to the tabbed parent
  redirect("/billing?tab=invoices");
}
