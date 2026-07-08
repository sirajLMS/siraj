"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";

import { ProfileAdministrationPanel } from "@/frontend/components/auth/ProfileAdministrationPanel";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import type { MessageSchema } from "@/shared/messages/types/message";
import { SalaryDetailsSection } from "./components/SalaryDetailsSection";
import { SystemConfigSection } from "./components/SystemConfigSection";
import { TeacherInfoSection } from "./components/TeacherInfoSection";
import { TeacherProfileFormActions } from "./components/TeacherProfileFormActions";
import { TeacherProfileStats } from "./components/TeacherProfileStats";
import {
  createTeacherProfileSchema,
  type TeacherProfileFormData,
  type TeacherProfileFormInput,
} from "./schemas/teacherProfileSchema";
import type { TeacherProfileViewProps } from "./types";

export function TeacherProfileView({ profile, isLoading, isSaving, onSave }: Readonly<TeacherProfileViewProps>) {
  const t = useTranslations("dashboard.teacherProfile");
  const validationMessages = useTranslations("dashboard.teacherProfile.validation");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const schema = createTeacherProfileSchema(
    validationMessages as unknown as MessageSchema["dashboard"]["teacherProfile"]["validation"]
  );

  const methods = useForm<TeacherProfileFormInput, undefined, TeacherProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      gender: "FEMALE",
      timezone: "Africa/Cairo",
      address: "",
      baseSalary: 0,
      currency: "USD",
      paymentMethod: "PAYPAL",
      zoomLink: "",
      accountStatus: true,
    },
  });

  useEffect(() => {
    if (profile) {
      methods.reset({
        ...profile,
        gender: profile.gender ?? undefined,
        paymentMethod: profile.paymentMethod ?? undefined,
      });
    }
  }, [profile, methods]);

  const handleDiscard = () => {
    if (profile) {
      methods.reset({
        ...profile,
        gender: profile.gender ?? undefined,
        paymentMethod: profile.paymentMethod ?? undefined,
      });
    }
  };

  const onSubmit = async (data: TeacherProfileFormData) => {
    await onSave(data);
  };

  if (isLoading || !profile) {
    return (
      <PageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[
          { label: t("breadcrumbs.teachers"), href: "/teachers" },
          { label: t("breadcrumbs.editProfile"), current: true },
        ]}
      />

      <Box sx={{ maxWidth: "4xl", mx: "auto" }}>
        <FormProvider {...(methods as unknown as UseFormReturn<TeacherProfileFormData>)}>
          <Box
            component="form"
            onSubmit={e => {
              methods.handleSubmit(onSubmit)(e);
            }}
            sx={theme => ({
              backgroundColor: theme.palette.background.paper,
              p: { xs: 2, md: 6 },
              borderRadius: "xl",
              border: `1px solid ${theme.palette.border.light}`,
              boxShadow: "sm",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            })}
          >
            <TeacherInfoSection />
            <SalaryDetailsSection />
            <SystemConfigSection />
            <TeacherProfileFormActions
              isSaving={isSaving}
              isMobile={isMobile}
              updatedAt={profile.updatedAt}
              onDiscard={handleDiscard}
            />
          </Box>
        </FormProvider>

        <TeacherProfileStats totalClasses={profile.totalClasses} avgEngagementScore={profile.avgEngagementScore} />

        <ProfileAdministrationPanel profileUserId={profile.userId} profileUserName={profile.fullName} />
      </Box>
    </PageContainer>
  );
}
