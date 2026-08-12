"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { PhoneDisplay } from "@/frontend/common/components/ui/display";
import { SupervisorAdminSection } from "@/frontend/common/views/dashboard/supervisor/profile/sections/SupervisorAdminSection";
import type { SupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}

export interface SupervisorProfileSharedOptions {
  readonly PageContainer: ComponentType<{ children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderProps>;
  readonly ProfileLayout: ComponentType<{ children: ReactNode }>;
  readonly ProfileSection: ComponentType<{ children: ReactNode }>;
}

export function SupervisorProfileShared({
  vm,
  options,
}: Readonly<{ vm: SupervisorProfileViewModel; options: SupervisorProfileSharedOptions }>) {
  const { labels, loading, error, profile } = vm;
  const { PageContainer, PageHeader, ProfileLayout, ProfileSection } = options;
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading && !profile ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error && !profile ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : null}
      {!loading && !error && !profile ? (
        <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.errors.notFound}</Typography>
      ) : null}
      {profile ? (
        <ProfileLayout>
          <ProfileSection>
            <Typography sx={{ typography: "titleLg", mb: 2 }}>{labels.sections.account}</Typography>
            <Stack spacing={1.5}>
              <ProfileField label={labels.fields.fullName} value={profile.name || labels.notSet} />
              <SupervisorAdminSection
                mode="view"
                labels={{
                  baseLabels: {
                    actions: {
                      manageLifecycle: labels.actions.manageLifecycle,
                    },
                  },
                }}
                profile={{
                  userId: profile.userId,
                  name: profile.name,
                  email: profile.email,
                  status: profile.status,
                }}
              />
            </Stack>
          </ProfileSection>
          <ProfileSection>
            <Typography sx={{ typography: "titleLg", mb: 2 }}>{labels.sections.contact}</Typography>
            <Stack spacing={1.5}>
              <ProfileField label={labels.fields.email} value={profile.email ?? labels.notSet} />
              <Stack spacing={0.25}>
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {labels.fields.phone}
                </Typography>
                <PhoneDisplay
                  phone={profile.phone}
                  fallback={labels.notSet}
                  typographyVariant="bodyMd"
                  sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}
                />
              </Stack>
            </Stack>
          </ProfileSection>
          <ProfileSection>
            <Typography sx={{ typography: "titleLg", mb: 2 }}>{labels.sections.role}</Typography>
            <ProfileField label={labels.fields.roleName} value={profile.roleName ?? labels.notSet} />
          </ProfileSection>
        </ProfileLayout>
      ) : null}
    </PageContainer>
  );
}

function ProfileField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
        {value}
      </Typography>
    </Stack>
  );
}
