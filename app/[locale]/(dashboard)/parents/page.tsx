import type { Metadata } from "next";
import { ParentsContainer } from "@/frontend/views/dashboard/admin/parents/home/ParentsContainer";

export const metadata: Metadata = {
  title: "Parents Directory | Siraj LMS",
  description: "Manage guardian profiles and financial records.",
};

export default function ParentsPage() {
  return <ParentsContainer />;
}
