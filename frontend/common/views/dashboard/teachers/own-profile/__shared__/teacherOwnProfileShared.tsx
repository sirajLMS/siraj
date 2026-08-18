"use client";

import { Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { LoadingState } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}

export interface TeacherOwnProfileSharedOptions {
  readonly PageContainer: ComponentType<{ children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderProps>;
  readonly ProfileLayout: ComponentType<{ children: ReactNode }>;
  readonly ProfileSection: ComponentType<{ children: ReactNode }>;
}

export function TeacherOwnProfileShared({
  vm,
  options,
}: Readonly<{ vm: TeacherOwnProfileViewModel; options: TeacherOwnProfileSharedOptions }>) {
  const { labels, loading, error, profile, salaryDisplay } = vm;
  const { t } = labels;
  const { PageContainer, PageHeader, ProfileLayout, ProfileSection } = options;
  return (
    <PageContainer>
      <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />
      {loading ? <LoadingState /> : null}
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{t.errors.failedToLoad}</Typography>
      ) : null}
      {profile ? (
        <>
          <DisplayCurrencyHint />
          <ProfileLayout>
            <ProfileSection>
              <Typography sx={{ typography: "titleLg", mb: 2 }}>{t.sections.contact}</Typography>
              <Stack spacing={1}>
                <Typography sx={{ typography: "bodyMd" }}>{profile.name}</Typography>
                <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                  {profile.email}
                </Typography>
                <PhoneDisplay
                  phone={profile.phone}
                  fallback={t.notSet}
                  typographyVariant="bodyMd"
                  sx={theme => ({ color: theme.palette.text.secondary })}
                />
                <TimezoneDisplay timezone={profile.timezone} fallback={t.notSet} />
              </Stack>
            </ProfileSection>
            <ProfileSection>
              <Typography sx={{ typography: "titleLg", mb: 2 }}>{t.sections.salary}</Typography>
              <Stack spacing={1}>
                <Typography sx={{ typography: "bodyMd" }}>{salaryDisplay}</Typography>
              </Stack>
            </ProfileSection>
          </ProfileLayout>
        </>
      ) : null}
    </PageContainer>
  );
}
