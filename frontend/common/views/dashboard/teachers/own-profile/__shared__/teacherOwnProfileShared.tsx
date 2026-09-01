"use client";

import { Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { LabeledField, PhoneDisplay, TimezoneDisplay } from "@/frontend/common/components/ui/display";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}

interface ProfileSectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

export interface TeacherOwnProfileSharedOptions {
  readonly PageContainer: ComponentType<{ children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderProps>;
  readonly ProfileLayout: ComponentType<{ children: ReactNode }>;
  readonly ProfileSection: ComponentType<ProfileSectionProps>;
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
      {error ? <ErrorState embedded message={t.errors.failedToLoad} /> : null}
      {profile ? (
        <>
          <DisplayCurrencyHint />
          <ProfileLayout>
            <ProfileSection title={t.sections.contact}>
              <Stack spacing={1}>
                <LabeledField label={t.fields.fullName} value={profile.name ?? t.notSet} />
                <LabeledField label={t.fields.email} value={profile.email ?? t.notSet} />
                <PhoneDisplay
                  phone={profile.phone}
                  fallback={t.notSet}
                  typographyVariant="bodyMd"
                  sx={theme => ({ color: theme.palette.text.secondary })}
                />
                <TimezoneDisplay timezone={profile.timezone} fallback={t.notSet} />
              </Stack>
            </ProfileSection>
            <ProfileSection title={t.sections.salary}>
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
