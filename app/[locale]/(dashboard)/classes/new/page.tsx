import type { Metadata } from "next";
import { CreateRecurringClassContainer } from "@/frontend/common/views/dashboard/classes/recurring/CreateRecurringClassContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.teacherCreateRecurringClass");
  // TODO: i18n dynamic lookup — namespace "dashboard.createRecurringClass" has no pageTitle field
  // in the new schema; TeacherCreateRecurringClassLabels only provides dialogTitle.
  return { title: t.dialogTitle };
}

export default function CreateRecurringClassPage() {
  return <CreateRecurringClassContainer />;
}
