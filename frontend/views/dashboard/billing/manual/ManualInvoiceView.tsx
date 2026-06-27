"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/components/ui";
import { ManualInvoiceDesktopView } from "./ManualInvoiceDesktopView";
import { ManualInvoiceMobileView } from "./ManualInvoiceMobileView";
import { manualInvoiceSchema } from "./schemas/manualInvoiceSchema";
import type { ManualInvoiceViewProps } from "./types/manualInvoiceViewTypes";
import { formatDraftTotal } from "./utils/manualInvoiceFormatters";

export function ManualInvoiceView({
  labels,
  parentOptions,
  studentOptions,
  isSubmitting,
  showSuccess,
  canCreate,
  canSendEmail,
  onBack,
  onSubmit,
  onDismissSuccess,
  onParentChange,
}: Readonly<ManualInvoiceViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const schema = manualInvoiceSchema(labels.validation);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      parentId: "",
      studentId: "",
      feeAmount: "",
      issueDate: "",
      dueDate: "",
      billingMonths: [],
    },
  });

  const feeAmount = useWatch({ control, name: "feeAmount" });
  const billingMonths = useWatch({ control, name: "billingMonths" });
  const currentParentId = useWatch({ control, name: "parentId" });
  const monthCount = billingMonths.length;
  const totalFormatted = formatDraftTotal(feeAmount, monthCount);

  useEffect(() => {
    onParentChange(currentParentId || null);
  }, [currentParentId, onParentChange]);

  useEffect(() => {
    if (currentParentId) {
      setValue("studentId", "");
    }
  }, [currentParentId, setValue]);

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);

  const onSubmitClick = () => {
    handleSubmit(data => {
      onSubmit(data, false);
    })();
  };

  const onSubmitAndSendEmailClick = () => {
    handleSubmit(data => {
      onSubmit(data, true);
    })();
  };

  const sharedProps = {
    labels,
    parentOptions,
    studentOptions,
    control,
    errors,
    totalFormatted,
    canCreate,
    canSendEmail,
    isSubmitting,
    onBack,
    onSubmitClick,
    onSubmitAndSendEmailClick,
  };

  return (
    <>
      {isMobile ? <ManualInvoiceMobileView {...sharedProps} /> : <ManualInvoiceDesktopView {...sharedProps} />}
      <FormSuccessSnackbar open={showSuccess} message={labels.successMessage} onClose={onDismissSuccess} />
    </>
  );
}
