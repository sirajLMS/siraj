"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";

import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
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
import type { TeacherProfileData } from "./types";

interface TeacherProfileViewProps {
  readonly profile: TeacherProfileData | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly onSave: (data: TeacherProfileFormData) => Promise<void>;
}

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
      gender: "female",
      timezone: "Africa/Cairo",
      address: "",
      baseSalary: 0,
      currency: "USD",
      paymentMethod: "paypal",
      zoomLink: "",
      accountStatus: true,
    },
  });

  useEffect(() => {
    if (profile) {
      methods.reset(profile);
    }
  }, [profile, methods]);

  const onSubmit = async (data: TeacherProfileFormData) => {
    await onSave(data);
  };

  if (isLoading || !profile) {
    return <PageContainer>Loading...</PageContainer>;
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
            <TeacherProfileFormActions isSaving={isSaving} isMobile={isMobile} lastModified={profile.lastModified} />
          </Box>
        </FormProvider>

        <TeacherProfileStats totalClasses={profile.totalClasses} parentRating={profile.parentRating} />
      </Box>
    </PageContainer>
  );
}
