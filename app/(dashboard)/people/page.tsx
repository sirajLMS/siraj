import { redirect } from "next/navigation";

interface PeopleRedirectPageProps {
  readonly searchParams: Promise<{ readonly tab?: string }>;
}

export default async function PeopleRedirectPage({ searchParams }: PeopleRedirectPageProps) {
  const { tab } = await searchParams;
  const query = tab ? `?tab=${encodeURIComponent(tab)}` : "";
  redirect(`/users${query}`);
}
