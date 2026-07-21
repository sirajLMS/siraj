import { redirect } from "@/shared/i18n/routing";

interface NewStudentPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewStudentPage({ searchParams }: NewStudentPageProps) {
  const search = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    }
  }

  const suffix = query.toString();
  redirect({ href: suffix ? `/students/onboarding?${suffix}` : "/students/onboarding" });
}
