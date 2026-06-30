"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, ComplaintStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  parentComplaintsQueryDocument,
  submitComplaintMutationDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";
import { parentAssociatedStudentsQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-profile.documents";
import { useParentComplaintsStore } from "@/frontend/stores/parentComplaintsStore";
import { logger } from "@/frontend/utils/logger";
import { ParentComplaintsView } from "./ParentComplaintsView";
import type { ComplaintFormData } from "./schemas/complaintFormSchema";
import type { ParentComplaintRecord, ParentStudentOption } from "./types/complaints.types";
import { buildComplaintsLabels } from "./utils/buildComplaintsLabels";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export interface ParentComplaintsContainerProps {
  readonly parentId?: string;
}

export function ParentComplaintsContainer({ parentId }: ParentComplaintsContainerProps) {
  const t = useTranslations("dashboard.complaints");
  const tc = useTranslations("common");
  const labels = buildComplaintsLabels(t);

  const isSubmitting = useParentComplaintsStore(state => state.isSubmitting);
  const showSuccess = useParentComplaintsStore(state => state.showSuccess);
  const setSubmitting = useParentComplaintsStore(state => state.setSubmitting);
  const resetSuccess = useParentComplaintsStore(state => state.resetSuccess);
  const page = useParentComplaintsStore(state => state.page);
  const pageSize = useParentComplaintsStore(state => state.pageSize);
  const setPage = useParentComplaintsStore(state => state.setPage);

  const { data, loading, error, refetch } = useQuery(parentComplaintsQueryDocument, {
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
    skip: !parentId,
    fetchPolicy: "cache-and-network",
  });

  const { data: studentsData } = useQuery(parentAssociatedStudentsQueryDocument, {
    variables: { parentId: parentId ?? "" },
    skip: !parentId,
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

  const studentOptions: readonly ParentStudentOption[] = useMemo(() => {
    if (!studentsData?.parentAssociatedStudents) return [];
    return studentsData.parentAssociatedStudents.map(student => ({
      id: student.id ?? "",
      label: student.name ?? "",
    }));
  }, [studentsData?.parentAssociatedStudents]);

  const totalCount = data?.parentComplaints?.totalCount ?? 0;

  const records: readonly ParentComplaintRecord[] = useMemo(() => {
    if (!data?.parentComplaints?.complaints) return [];
    return data.parentComplaints.complaints.map(record => ({
      id: record.id ?? "",
      regarding: record.studentName ? `Regarding: ${record.studentName}` : "General",
      summary: record.body ?? "",
      status: record.status ?? ComplaintStatus.Unanswered,
      adminResponse:
        record.responses && record.responses.length > 0
          ? {
              text: record.responses[0].body ?? "",
              answeredAt: record.responses[0].createdAt ?? "",
            }
          : undefined,
    }));
  }, [data?.parentComplaints]);

  if (!parentId) {
    return (
      <Box sx={{ p: 4 }}>
        <StyledErrorTypography>
          Access Denied: You must be logged in as an associated parent to view complaints.
        </StyledErrorTypography>
      </Box>
    );
  }

  const handleSubmit = (formData: ComplaintFormData) => {
    setSubmitting(true);
    resetSuccess();
    void submitComplaint({
      variables: {
        input: {
          studentId: formData.studentId,
          submitterEmail: formData.contactEmail,
          body: formData.complaintDetails,
          category: formData.category,
          files: null,
        },
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    logger.error("Error loading parent complaints:", { error });
    return <StyledErrorTypography>{tc("loadFailed")}</StyledErrorTypography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.SupportSubmitComplaint]}>
      <ParentComplaintsView
        labels={labels.parent}
        studentOptions={studentOptions}
        records={records}
        hasOlderRecords={data?.parentComplaints?.pageInfo?.hasMorePages ?? false}
        isSubmitting={isSubmitting}
        showSuccess={showSuccess}
        canSubmit={true}
        onSubmit={handleSubmit}
        onDismissSuccess={resetSuccess}
        onLoadOlderRecords={() => void refetch()}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </RequirePermission>
  );
}
