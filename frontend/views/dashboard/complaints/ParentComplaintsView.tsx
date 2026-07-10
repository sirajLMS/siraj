"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ComplaintCategory } from "@/frontend/graphql/generated/gql/graphql-types";
import { ParentComplaintsDesktopView } from "@/frontend/views/dashboard/complaints/ParentComplaintsDesktopView";
import { ParentComplaintsMobileView } from "@/frontend/views/dashboard/complaints/ParentComplaintsMobileView";
import { complaintFormSchema } from "@/frontend/views/dashboard/complaints/schemas/complaintFormSchema";
import type { ParentComplaintsViewProps } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";

export function ParentComplaintsView({
  labels,
  studentOptions,
  records,
  hasOlderRecords,
  isSubmitting,
  showSuccess,
  canSubmit,
  onSubmit,
  onDismissSuccess,
  onLoadOlderRecords,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<ParentComplaintsViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const schema = complaintFormSchema(labels.validation);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category: ComplaintCategory.Other,
      studentId: "",
      contactEmail: "",
      complaintDetails: "",
    },
  });

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);

  const handleFormSubmit = () => {
    handleSubmit(data => {
      onSubmit(data);
      reset();
    })();
  };

  const viewProps = {
    labels,
    studentOptions,
    records,
    hasOlderRecords,
    control,
    errors,
    isSubmitting,
    showSuccess,
    canSubmit,
    onDismissSuccess,
    onFormSubmit: handleFormSubmit,
    onLoadOlderRecords,
    page,
    pageSize,
    totalCount,
    onPageChange,
  };

  if (isMobile) {
    return <ParentComplaintsMobileView {...viewProps} />;
  }

  return <ParentComplaintsDesktopView {...viewProps} />;
}
