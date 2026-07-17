"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { PageHeaderBreadcrumb } from "@/frontend/common/components/ui";
import { classSubjectByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import type {
  SubjectDetailContainerProps,
  SubjectDetailData,
  SubjectResourceItem,
} from "@/frontend/common/views/dashboard/subjects/detail/types";

/**
 * View-model labels for the subject detail page used by both tiers.
 *
 * Mirrors the `SubjectsLabels["detail"]` shape pulled out of the i18n binding
 * so the View components receive a flat, tier-agnostic props bundle.
 */
export interface SubjectDetailViewModelLabels {
  readonly pageTitle: (name: string) => string;
  readonly notFound: string;
  readonly resourcesTitle: string;
  readonly resourcesSubtitle: (count: number) => string;
  readonly noResources: string;
  readonly download: string;
  readonly untitledResource: string;
  readonly subjectsPageTitle: string;
}

export interface UseSubjectDetailViewModelProps extends SubjectDetailContainerProps {
  readonly labels: SubjectDetailViewModelLabels;
}

export interface SubjectDetailViewModel {
  readonly subject: SubjectDetailData | null;
  readonly resources: readonly SubjectResourceItem[];
  readonly breadcrumbs: readonly PageHeaderBreadcrumb[];
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly labels: SubjectDetailViewModelLabels;
}

/**
 * `useSubjectDetailViewModel` encapsulates the single-subject GraphQL fetch,
 * resource sort, breadcrumbs memo, and the "not found" derivation. Both the
 * mobile and desktop View components receive the resulting flat object — they
 * only render the loading / empty / notFound states and the resource list.
 */
export function useSubjectDetailViewModel({
  subjectId,
  labels,
}: Readonly<UseSubjectDetailViewModelProps>): SubjectDetailViewModel {
  const { data, loading } = useQuery(classSubjectByIdQueryDocument, {
    variables: { id: subjectId },
    skip: !subjectId,
  });

  const subject = data?.classSubject ?? null;

  const resources = useMemo<readonly SubjectResourceItem[]>(() => {
    if (!subject?.resources) return [];
    return [...subject.resources].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [subject?.resources]);

  const breadcrumbs = useMemo<readonly PageHeaderBreadcrumb[]>(
    () => [
      { label: labels.subjectsPageTitle, href: "/subjects" },
      { label: subject?.name ?? "", current: true },
    ],
    [labels.subjectsPageTitle, subject?.name]
  );

  const notFound = !loading && !subject;

  return {
    subject,
    resources,
    breadcrumbs,
    loading,
    notFound,
    labels,
  };
}
