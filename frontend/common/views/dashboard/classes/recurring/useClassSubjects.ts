"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import type { ClassSubjectOption } from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface ClassSubjectsResult {
  readonly subjects: readonly ClassSubjectOption[];
  readonly loading: boolean;
}

/**
 * Loads the active class subjects once and projects them to picker options.
 * Owner hooks (ViewModels / containers) call this and pass the result to
 * presentational subject selects — the selects themselves never fetch.
 */
export function useClassSubjects(): ClassSubjectsResult {
  const { data, loading } = useQuery(classSubjectsQueryDocument, {
    variables: { categoryId: null },
  });

  const subjects = useMemo<readonly ClassSubjectOption[]>(
    () =>
      (data?.classSubjects ?? [])
        .filter(subject => subject?.isActive !== false && subject?.id)
        .map(subject => ({ id: subject?.id ?? "", name: subject?.name ?? subject?.id ?? "" })),
    [data?.classSubjects]
  );

  return { subjects, loading };
}
