"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { createManualInvoiceMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { parentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-directory.documents";
import { ManualInvoiceView } from "./ManualInvoiceView";
import type { ManualInvoiceFormData } from "./schemas/manualInvoiceSchema";
import type { ParentInvoiceOption } from "./types/manualInvoiceViewTypes";
import { buildManualInvoiceLabels } from "./utils/buildManualInvoiceLabels";

export function ManualInvoiceContainer() {
  const t = useTranslations("dashboard.billing.manual");
  const router = useRouter();
  const locale = useLocale();
  const labels = buildManualInvoiceLabels(t);

  const [showSuccess, setShowSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const { data: parentData, loading: parentsLoading } = useQuery(parentDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null },
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
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    },
  });

  const handleBack = () => {
    router.push(`/${locale}/billing`);
  };

  const handleSubmit = (data: ManualInvoiceFormData, _sendEmail: boolean) => {
    void createInvoice({
      variables: {
        parentId: data.parentId,
        studentId: null,
        amount: data.feeAmount,
        currency: "USD",
        invoiceType: "MANUAL",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        exchangeRateSnapshot: null,
        exchangeRateSource: null,
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

  return (
    <RequirePermission permissions={[AppPermission.BillingCreateInvoice]} fallback={null}>
      <ManualInvoiceView
        labels={labels}
        parentOptions={parentOptions}
        isSubmitting={isSubmitting || parentsLoading}
        showSuccess={showSuccess}
        canCreate
        canSendEmail={false}
        onBack={handleBack}
        onSubmit={handleSubmit}
        onDismissSuccess={() => setShowSuccess(false)}
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
