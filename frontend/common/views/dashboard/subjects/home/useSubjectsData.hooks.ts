"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { classCategoriesQueryDocument, classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { CategoryItem, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";

interface SubjectsDataResult {
  readonly categories: readonly CategoryItem[];
  readonly subjects: readonly SubjectItem[];
  readonly filteredSubjects: readonly SubjectItem[];
  readonly isLoading: boolean;
  readonly refetchSubjects: () => Promise<unknown>;
}

function isSubjectItem(value: unknown): value is SubjectItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string"
  );
}

function isSubjectItemList(value: unknown): value is readonly SubjectItem[] {
  return Array.isArray(value) && value.every(isSubjectItem);
}

export function useSubjectsData(activeCategoryId: string | null): SubjectsDataResult {
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useQuery(classCategoriesQueryDocument, {
    errorPolicy: "all",
  });
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useQuery(classSubjectsQueryDocument, {
    variables: { categoryId: activeCategoryId },
    errorPolicy: "all",
  });

  if (categoriesError) {
    logger.error("Error fetching class categories:", categoriesError);
  }
  if (subjectsError) {
    logger.error("Error fetching class subjects:", subjectsError);
  }

  const categories = useMemo<readonly CategoryItem[]>(
    () => categoriesData?.classCategories ?? [],
    [categoriesData?.classCategories]
  );

  const subjects = useMemo<readonly SubjectItem[]>(
    () => (isSubjectItemList(subjectsData?.classSubjects) ? subjectsData.classSubjects : []),
    [subjectsData]
  );

  const filteredSubjects = useMemo<readonly SubjectItem[]>(
    () => (activeCategoryId ? subjects.filter(s => s.category?.id === activeCategoryId) : subjects),
    [subjects, activeCategoryId]
  );

  const isLoading = categoriesLoading || subjectsLoading;

  return { categories, subjects, filteredSubjects, isLoading, refetchSubjects };
}
