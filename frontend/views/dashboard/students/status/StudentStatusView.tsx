"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import type { StudentStatus } from "@/shared/lib/enum";
import { StudentStatus as StudentStatusEnum } from "@/shared/lib/enum";
import { AdminHoldControls } from "./components/AdminHoldControls";
import { PolicyOverviewCard, SuspensionWarningBanner } from "./components/PolicyOverviewCard";
import { StudentStatusHeader } from "./components/StudentStatusHeader";
import { UpcomingClassesTable } from "./components/UpcomingClassesTable";
import { type StatusUpdateFormData, statusUpdateSchema } from "./schemas/statusUpdateSchema";
import type { StudentStatusViewProps } from "./types";

export function StudentStatusView({ student, isUpdating, onUpdateStatus }: Readonly<StudentStatusViewProps>) {
  const t = useTranslations("dashboard.studentStatus");

  const methods = useForm<StatusUpdateFormData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: StudentStatusEnum.REGULAR,
      reason: "",
    },
  });

  const selectedStatus = useWatch({
    control: methods.control,
    name: "status",
    defaultValue: StudentStatusEnum.REGULAR,
  });

  useEffect(() => {
    methods.reset({
      status: student.status,
      reason: "",
    });
  }, [student, methods]);

  const handleSubmit = async (data: StatusUpdateFormData) => {
    await onUpdateStatus(data.status as StudentStatus, data.reason);
    methods.reset({ status: data.status, reason: "" });
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("studentId", { id: student.id })}
        breadcrumbs={[
          { label: t("breadcrumbs.students"), href: "/students" },
          { label: t("breadcrumbs.statusHold"), current: true },
        ]}
      />

      <StudentStatusHeader student={student} />

      <Grid container spacing="gutter">
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            component="form"
            onSubmit={e => {
              methods.handleSubmit(handleSubmit)(e);
            }}
            sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}
          >
            <FormProvider {...methods}>
              <AdminHoldControls isUpdating={isUpdating} />
            </FormProvider>
            <PolicyOverviewCard />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}>
            {selectedStatus === StudentStatusEnum.SUSPENDED && <SuspensionWarningBanner />}
            <UpcomingClassesTable classes={student.upcomingClasses} studentId={student.id} />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
