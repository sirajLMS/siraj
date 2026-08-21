"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { ComplaintCategory, ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  parentComplaintsQueryDocument,
  submitComplaintMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useParentComplaintsStore } from "@/frontend/common/stores/parentComplaintsStore";
import {
  type ParentComplaintsViewModel,
  useParentComplaintsViewModel,
} from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";
import { buildComplaintsLabels } from "@/frontend/common/views/dashboard/complaints/utils/buildComplaintsLabels";
import { Translation, useAppTranslation } from "@/shared/locale";

const COMPLAINT_STATUS_VALUES = new Set<string>(Object.values(ComplaintStatus));
function isComplaintStatus(value: string): value is ComplaintStatus {
  return COMPLAINT_STATUS_VALUES.has(value);
}

const COMPLAINT_CATEGORY_VALUES = new Set<string>(Object.values(ComplaintCategory));
function isComplaintCategory(value: string): value is ComplaintCategory {
  return COMPLAINT_CATEGORY_VALUES.has(value);
}

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
      status: isComplaintStatus(record.status ?? "")
        ? (record.status ?? ComplaintStatus.Unanswered)
        : ComplaintStatus.Unanswered,
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
          category: isComplaintCategory(formData.category) ? formData.category : ComplaintCategory.Other,
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

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
