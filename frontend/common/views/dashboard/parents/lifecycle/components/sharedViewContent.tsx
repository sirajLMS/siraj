"use client";

import { PersonOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  LifecycleControls,
  PolicyOverviewCard,
} from "@/frontend/common/views/dashboard/parents/lifecycle/components/sharedViewContent.parts";
import { useParentLifecycleForm } from "@/frontend/common/views/dashboard/parents/lifecycle/components/useParentLifecycleForm";
import type { LifecycleUpdateFormData } from "@/frontend/common/views/dashboard/parents/lifecycle/schemas/lifecycleUpdateSchema";
import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";
import type { ParentLifecycleLabels } from "@/shared/locale/types/dashboard/parents";

type LifecycleStatusKey = keyof ParentLifecycleLabels["status"];
type AccountStatusKey = keyof ParentLifecycleLabels["accountStatus"];

const LIFECYCLE_STATUS_KEYS: readonly LifecycleStatusKey[] = [
  "regular",
  "on_trial",
  "on_leave",
  "suspended",
  "deactivated",
];

const ACCOUNT_STATUS_KEYS: readonly AccountStatusKey[] = ["activated", "deactivated"];

function isLifecycleStatusKey(value: string): value is LifecycleStatusKey {
  return (LIFECYCLE_STATUS_KEYS as readonly string[]).includes(value);
}

function isAccountStatusKey(value: string): value is AccountStatusKey {
  return (ACCOUNT_STATUS_KEYS as readonly string[]).includes(value);
}

export function LifecycleParentSummaryCard({
  parent,
  labels,
  size = "lg",
}: Readonly<{ parent: ParentLifecycleViewProps["parent"]; labels: ParentLifecycleLabels; size?: "lg" | "sm" }>) {
  const lifecycleKey = parent.lifecycleStatus.toLowerCase();
  const accountKey = parent.accountStatus.toLowerCase();

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: size === "lg" ? { xs: 3, md: 4 } : { xs: 2, md: 3 },
        border: `1px solid ${theme.palette.border.main}`,
        mb: 3,
      })}
    >
      <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
        <PersonOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: size === "lg" ? 40 : 32 })} />
        <Box>
          <Typography sx={{ typography: "titleLg", fontWeight: 700 }}>{parent.name}</Typography>
          <Typography
            sx={theme => ({
              typography: "bodyMd",
              color: theme.palette.text.secondary,
            })}
          >
            {parent.email}
          </Typography>
          <Stack sx={{ mt: 1, flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
            <StatusBadge
              category="studentAccount"
              status={lifecycleKey}
              label={labels.status[isLifecycleStatusKey(lifecycleKey) ? lifecycleKey : "regular"]}
            />
            <StatusBadge
              category="staffAccount"
              status={accountKey}
              label={labels.accountStatus[isAccountStatusKey(accountKey) ? accountKey : "activated"]}
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export function LifecycleFormBody({
  parent,
  labels,
  isUpdating,
  onUpdateLifecycle,
  children,
}: Readonly<ParentLifecycleViewProps & { readonly labels: ParentLifecycleLabels; readonly children?: ReactNode }>) {
  const methods = useParentLifecycleForm(parent);

  const handleSubmit = async (data: LifecycleUpdateFormData) => {
    await onUpdateLifecycle(data.lifecycleStatus, data.reason ?? "");
    methods.reset({ lifecycleStatus: data.lifecycleStatus, reason: "" });
  };

  return (
    <form
      onSubmit={e => {
        void methods.handleSubmit(handleSubmit)(e);
      }}
    >
      <Box sx={theme => ({ display: "flex", flexDirection: "column", gap: theme.layout.gutter })}>
        <FormProvider {...methods}>
          <LifecycleControls labels={labels} isUpdating={isUpdating} />
        </FormProvider>
        <PolicyOverviewCard labels={labels} />
        {children}
      </Box>
    </form>
  );
}
