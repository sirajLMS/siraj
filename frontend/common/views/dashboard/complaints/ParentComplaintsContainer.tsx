"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  AppPermission,
  type ComplaintCategory,
  type ComplaintStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  parentComplaintsQueryDocument,
  submitComplaintMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useParentComplaintsStore } from "@/frontend/common/stores/parentComplaintsStore";
import type { ParentComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";
import { useParentComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";
import { buildComplaintsLabels } from "@/frontend/common/views/dashboard/complaints/utils/buildComplaintsLabels";
import { Translation, useAppTranslation } from "@/shared/locale";

const lazyViews = createLazyView<ParentComplaintsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/complaints/parentComplaints.mobile").then(m => ({
      default: m.ParentComplaintsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/complaints/parentComplaints.desktop").then(m => ({
      default: m.ParentComplaintsDesktopView,
    }))
);

export function ParentComplaintsContainer() {
  const labels = buildComplaintsLabels(useAppTranslation(Translation.Dashboard.Complaints));

  const isSubmitting = useParentComplaintsStore(state => state.isSubmitting);
  const showSuccess = useParentComplaintsStore(state => state.showSuccess);
  const setSubmitting = useParentComplaintsStore(state => state.setSubmitting);
  const resetSuccess = useParentComplaintsStore(state => state.resetSuccess);
  const page = useParentComplaintsStore(state => state.page);
  const pageSize = useParentComplaintsStore(state => state.pageSize);
  const setPage = useParentComplaintsStore(state => state.setPage);

  const { data, refetch } = useQuery(parentComplaintsQueryDocument, {
    variables: {
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const [submitComplaint] = useMutation(submitComplaintMutationDocument, {
    onCompleted: () => {
      setSubmitting(false);
      useParentComplaintsStore.setState({ showSuccess: true });
      void refetch();
    },
    onError: () => {
      setSubmitting(false);
    },
  });

  const records =
    data?.parentComplaints?.complaints?.map(record => ({
      id: record.id ?? "",
      regarding: record.studentName ? `Regarding: ${record.studentName}` : "General",
      summary: record.body ?? "",
      status: (record.status ?? "Unanswered") as ComplaintStatus,
      adminResponse:
        record.responses && record.responses.length > 0
          ? {
              text: record.responses[0].body ?? "",
              answeredAt: record.responses[0].createdAt ?? "",
            }
          : undefined,
    })) ?? [];

  const onSubmit = (formData: {
    studentId: string;
    contactEmail: string;
    complaintDetails: string;
    category: string;
  }) => {
    setSubmitting(true);
    resetSuccess();
    void submitComplaint({
      variables: {
        input: {
          studentId: formData.studentId,
          submitterEmail: formData.contactEmail,
          body: formData.complaintDetails,
          category: formData.category as ComplaintCategory,
          files: null,
        },
      },
    });
  };

  const viewModel = useParentComplaintsViewModel({
    labels: labels.parent,
    records,
    hasOlderRecords: data?.parentComplaints?.pageInfo?.hasMorePages ?? false,
    isSubmitting,
    showSuccess,
    canSubmit: true,
    onSubmit,
    onDismissSuccess: resetSuccess,
    onLoadOlderRecords: () => void refetch(),
    page,
    pageSize,
    totalCount: data?.parentComplaints?.totalCount ?? 0,
    onPageChange: setPage,
  });

  return (
    <RequirePermission permissions={[AppPermission.SupportSubmitComplaint]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}
