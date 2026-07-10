"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, InvoiceType } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  createManualInvoiceMutationDocument,
  parentDirectoryQueryDocument,
  studentDirectoryQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { ManualInvoiceView } from "@/frontend/views/dashboard/billing/manual/ManualInvoiceView";
import type { ManualInvoiceFormData } from "@/frontend/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { buildManualInvoiceLabels } from "@/frontend/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { useRouter } from "@/shared/i18n/routing";

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function billingMonthsToInput(months: string[], year?: number): { year: number; month: number }[] {
  const targetYear = year ?? new Date().getFullYear();
  return months
    .map(m => {
      const month = MONTH_MAP[m];
      return month ? { year: targetYear, month } : null;
    })
    .filter((m): m is { year: number; month: number } => m !== null);
}

export function ManualInvoiceContainer() {
  const t = useTranslations("dashboard.billing.manual");
  const tc = useTranslations("common");
  const router = useRouter();
  const labels = buildManualInvoiceLabels(t);

  const [showSuccess, setShowSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const { data: parentData, loading: parentsLoading } = useQuery(parentDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null, lifecycleStatusFilter: null },
    fetchPolicy: "cache-first",
  });

  const { data: studentData, loading: studentsLoading } = useQuery(studentDirectoryQueryDocument, {
    variables: {
      paginationArgs: null,
      orderBy: null,
      filterArgs: selectedParentId ? ({ parentId: selectedParentId } as never) : null,
    },
    skip: !selectedParentId,
    fetchPolicy: "cache-first",
  });

  const [createInvoice, { loading: isSubmitting }] = useMutation(createManualInvoiceMutationDocument, {
    onCompleted: data => {
      setShowSuccess(true);
      const invoiceId = data.createManualInvoice?.id ?? "";
      setSnackbarMessage(t("createSuccess", { id: invoiceId }));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    },
    onError: error => {
      logger.error("Create manual invoice failed:", { error });
      setSnackbarMessage(tc("operationFailed"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    },
  });

  const handleBack = () => {
    router.push("/billing");
  };

  const handleSubmit = (data: ManualInvoiceFormData, sendEmail: boolean) => {
    void createInvoice({
      variables: {
        parentId: data.parentId ?? null,
        studentId: ("studentId" in data ? data.studentId : null) ?? null,
        amount: data.feeAmount,
        currency: data.currency,
        invoiceType: InvoiceType.Manual,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        exchangeRateSnapshot: null,
        exchangeRateSource: null,
        billingMonths: billingMonthsToInput(data.billingMonths),
        sendEmail,
      },
    });
  };

  const parentOptions: ParentInvoiceOption[] = (parentData?.parentDirectory?.rows ?? [])
    .filter((row): row is { id: string; name: string } & typeof row => row.id !== null && row.name !== null)
    .map(row => ({
      id: row.id,
      name: row.name,
      label: `${row.name} (ID: ${row.id})`,
    }));

  const studentOptions: StudentOption[] = useMemo(
    () =>
      (studentData?.studentDirectory?.rows ?? [])
        .filter((s): s is { id: string; name: string } & typeof s => s.id != null)
        .map(s => ({
          id: s.id,
          name: s.name ?? t("unknown"),
        })),
    [studentData?.studentDirectory?.rows, t]
  );

  return (
    <RequirePermission permissions={[AppPermission.BillingCreateInvoice]} fallback={null}>
      <DisplayCurrencyHint />
      <ManualInvoiceView
        labels={labels}
        parentOptions={parentOptions}
        studentOptions={studentOptions}
        isSubmitting={isSubmitting || parentsLoading || studentsLoading}
        showSuccess={showSuccess}
        canCreate
        canSendEmail
        onBack={handleBack}
        onSubmit={handleSubmit}
        onDismissSuccess={() => setShowSuccess(false)}
        onParentChange={setSelectedParentId}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </RequirePermission>
  );
}
