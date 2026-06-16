"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ParentComplaintsDesktopView } from "./ParentComplaintsDesktopView";
import { ParentComplaintsMobileView } from "./ParentComplaintsMobileView";
import { complaintFormSchema } from "./schemas/complaintFormSchema";
import type { ParentComplaintsViewProps } from "./types/complaintsViewTypes";

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
    void handleSubmit(data => {
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
  };

  if (isMobile) {
    return <ParentComplaintsMobileView {...viewProps} />;
  }

  return <ParentComplaintsDesktopView {...viewProps} />;
}
