"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { PageHeaderBreadcrumb } from "@/frontend/common/components/ui/container/page";
import { classSubjectByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import type { SubjectDetailData, SubjectResourceItem } from "@/frontend/common/views/dashboard/subjects/detail/types";
import { useAppTranslation } from "@/shared/locale";

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

export interface UseSubjectDetailViewModelProps {
  readonly subjectId: string;
}

export interface SubjectDetailViewModel {
  readonly subject: SubjectDetailData | null;
  readonly resources: readonly SubjectResourceItem[];
  readonly breadcrumbs: readonly PageHeaderBreadcrumb[];
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly labels: SubjectDetailViewModelLabels;
  readonly onDownloadResource: (resource: SubjectResourceItem) => void;
}

/**
 * `useSubjectDetailViewModel` encapsulates the single-subject GraphQL fetch,
 * resource sort, breadcrumbs memo, and the "not found" derivation. Both the
 * mobile and desktop View components receive the resulting flat object — they
 * only render the loading / empty / notFound states and the resource list.
 */
export function useSubjectDetailViewModel(props: Readonly<UseSubjectDetailViewModelProps>): SubjectDetailViewModel {
  const { subjectId } = props;
  const { subjects } = useAppTranslation().dashboardTranslations;

  const labels: SubjectDetailViewModelLabels = useMemo(
    () => ({
      pageTitle: subjects.detail.pageTitle,
      notFound: subjects.detail.notFound,
      resourcesTitle: subjects.detail.resourcesTitle,
      resourcesSubtitle: subjects.detail.resourcesSubtitle,
      noResources: subjects.detail.noResources,
      download: subjects.detail.download,
      untitledResource: subjects.detail.untitledResource,
      subjectsPageTitle: subjects.pageTitle,
    }),
    [subjects]
  );

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

  // NEW FOR PLAN v5: onDownloadResource exposed by the ViewModel so the tier views no longer call `window.open` directly (was a window.open-in-tier violation per specs §3 N19).
  const onDownloadResource = (resource: SubjectResourceItem) => {
    if (resource.filePath) {
      window.open(`/api/storage/files/${resource.filePath}`, "_blank", "noopener,noreferrer");
    }
  };

  return {
    subject,
    resources,
    breadcrumbs,
    loading,
    notFound,
    labels,
    onDownloadResource,
  };
}
