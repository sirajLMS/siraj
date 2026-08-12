"use client";

import { ImportantNotesShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/__shared__/importantNotesShared";
import type { ImportantNotesProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";

export function ImportantNotesDesktop(props: Readonly<ImportantNotesProps>) {
  return <ImportantNotesShared {...props} />;
}
