"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Grid, Snackbar } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import type { StudentStatusInfo } from "@/frontend/stores/studentStatusStore";
import { AdminHoldControls } from "./components/AdminHoldControls";
import { PolicyOverviewCard, SuspensionWarningBanner } from "./components/PolicyOverviewCard";
import { StudentStatusHeader } from "./components/StudentStatusHeader";
import { UpcomingClassesTable } from "./components/UpcomingClassesTable";
import { type StatusUpdateFormData, statusUpdateSchema } from "./schemas/statusUpdateSchema";

interface StudentStatusViewProps {
  readonly studentInfo: StudentStatusInfo | null;
  readonly isLoading: boolean;
  readonly isUpdating: boolean;
  readonly onUpdateStatus: (status: "regular" | "suspended" | "on-leave", reason: string) => Promise<void>;
}

export function StudentStatusView({
  studentInfo,
  isLoading,
  isUpdating,
  onUpdateStatus,
}: Readonly<StudentStatusViewProps>) {
  const t = useTranslations("dashboard.studentStatus");
  const [showSuccess, setShowSuccess] = useState(false);

  const methods = useForm<StatusUpdateFormData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: "regular",
      reason: "",
    },
  });

  const selectedStatus = useWatch({
    control: methods.control,
    name: "status",
    defaultValue: "regular",
  });

  useEffect(() => {
    if (studentInfo) {
      methods.reset({
        status: studentInfo.status,
        reason: "",
      });
    }
  }, [studentInfo, methods]);

  const handleSubmit = async (data: StatusUpdateFormData) => {
    await onUpdateStatus(data.status, data.reason);
    setShowSuccess(true);
    methods.reset({ status: data.status, reason: "" });
  };

  if (isLoading || !studentInfo) {
    return <PageContainer>Loading...</PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("studentId", { id: studentInfo.id })}
        breadcrumbs={[
          { label: t("breadcrumbs.students"), href: "/students" },
          { label: t("breadcrumbs.statusHold"), current: true },
        ]}
      />

      <StudentStatusHeader student={studentInfo} />

      <Grid container spacing="gutter">
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            component="form"
            onSubmit={e => {
              void methods.handleSubmit(handleSubmit)(e);
            }}
            sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}
          >
            <FormProvider {...methods}>
              <AdminHoldControls isUpdating={isUpdating} />
            </FormProvider>
            <PolicyOverviewCard />
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}>
            {selectedStatus === "suspended" && <SuspensionWarningBanner />}
            <UpcomingClassesTable classes={studentInfo.upcomingClasses} studentId={studentInfo.id} />
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => {
          setShowSuccess(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          sx={theme => ({
            borderRadius: "xl",
            boxShadow: theme.palette.shadow.card,
            bgcolor: theme.palette.successContainer,
            color: theme.palette.onSuccessContainer,
            "& .MuiAlert-icon": {
              color: theme.palette.onSuccessContainer,
            },
          })}
        >
          {t("successMessage")}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
