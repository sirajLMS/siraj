"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ParentAssignedStudentsQuery,
  ParentComplaintsQuery,
} from "@/frontend/common/graphql/generated/gql/operations";
import {
  parentAssignedStudentsQueryDocument,
  parentComplaintsQueryDocument,
  submitComplaintMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useParentComplaintsStore } from "@/frontend/common/stores/parentComplaintsStore";
import { logger } from "@/frontend/common/utils/logger";
import { ParentComplaintsView } from "@/frontend/common/views/dashboard/complaints/parentComplaintsView";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import type {
  ParentComplaintRecord,
  ParentStudentOption,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { buildComplaintsLabels } from "@/frontend/common/views/dashboard/complaints/utils/buildComplaintsLabels";
import { useAppTranslation } from "@/shared/locale/client";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export interface ParentComplaintsContainerProps {
  readonly parentId?: string;
}

function mapStudentOptions(
  students: ParentAssignedStudentsQuery["parentAssignedStudents"] | null | undefined
): ParentStudentOption[] {
  if (!students?.rows) return [];
  return students.rows.map(student => ({
    id: student.id ?? "",
    label: student.name ?? "",
  }));
}

function mapComplaintRecords(
  complaints: ParentComplaintsQuery["parentComplaints"] | null | undefined
): ParentComplaintRecord[] {
  if (!complaints?.complaints) return [];
  return complaints.complaints.map(record => ({
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
}

function buildComplaintInput(formData: ComplaintFormData) {
  return {
    input: {
      studentId: formData.studentId,
      submitterEmail: formData.contactEmail,
      body: formData.complaintDetails,
      category: formData.category,
      files: null,
    },
  };
}

function LoadingView() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress />
    </Box>
  );
}

function ErrorView({ message }: { readonly message: string }) {
  return <StyledErrorTypography>{message}</StyledErrorTypography>;
}

function AccessDeniedView() {
  return (
    <Box sx={{ p: 4 }}>
      <StyledErrorTypography>
        Access Denied: You must be logged in as an associated parent to view complaints.
      </StyledErrorTypography>
    </Box>
  );
}

export function ParentComplaintsContainer({ parentId }: ParentComplaintsContainerProps) {
  const tComplaints = useAppTranslation("dashboard.complaints").parent;
  const tCommon = useAppTranslation("common");
  const labels = buildComplaintsLabels({ parent: tComplaints, admin: {} as any });

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

  const { data: studentsData } = useQuery(parentAssignedStudentsQueryDocument);

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

  const studentOptions = useMemo(
    () => mapStudentOptions(studentsData?.parentAssignedStudents),
    [studentsData?.parentAssignedStudents]
  );

  const records = useMemo(() => mapComplaintRecords(data?.parentComplaints), [data?.parentComplaints]);

  if (!parentId) return <AccessDeniedView />;
  if (loading && !data) return <LoadingView />;

  if (error) {
    logger.error("Error loading parent complaints:", { error });
    return <ErrorView message={tCommon.loadFailed} />;
  }

  const handleSubmit = (formData: ComplaintFormData) => {
    setSubmitting(true);
    resetSuccess();
    void submitComplaint({ variables: buildComplaintInput(formData) });
  };

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
        totalCount={data?.parentComplaints?.totalCount ?? 0}
        onPageChange={setPage}
      />
    </RequirePermission>
  );
}
