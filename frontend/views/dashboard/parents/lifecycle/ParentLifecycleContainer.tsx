"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AccountStatus, AppPermission, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { changeParentLifecycleStatusMutationDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-lifecycle.documents";
import { parentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-profile.documents";
import { logger } from "@/frontend/common/utils/logger";
import { ParentLifecycleView } from "@/frontend/views/dashboard/parents/lifecycle/ParentLifecycleView";
import type { ParentLifecyclePageData } from "@/frontend/views/dashboard/parents/lifecycle/types";

export function ParentLifecycleContainer() {
  const t = useTranslations("dashboard.parentLifecycle");
  const tc = useTranslations("common");
  const params = useParams();
  const parentId = typeof params?.id === "string" ? params.id : "";
  const notifications = useNotifications();

  const { data, loading, error, refetch } = useQuery(parentProfileQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const [changeLifecycleStatus, { loading: isUpdating }] = useMutation(changeParentLifecycleStatusMutationDocument, {
    onCompleted: () => {
      notifications.show(t("successMessage"), {
        severity: "success",
        autoHideDuration: 5000,
      });
      void refetch();
    },
    onError: mutationError => {
      logger.error("Change parent lifecycle status failed:", { error: mutationError });
      notifications.show(tc("operationFailed"), {
        severity: "error",
        autoHideDuration: 5000,
      });
    },
  });

  const parent: ParentLifecyclePageData | null = useMemo(() => {
    const profile = data?.parentProfile;
    if (!profile?.id || !profile.userId || !profile.name) return null;

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      email: profile.email ?? "",
      lifecycleStatus: (profile.lifecycleStatus as ParentStatus) ?? ParentStatus.Regular,
      accountStatus: profile.accountStatus ?? AccountStatus.Activated,
      avatarUrl: profile.avatarUrl ?? null,
    };
  }, [data]);

  const handleUpdateLifecycle = useCallback(
    async (status: ParentStatus, reason: string) => {
      if (!parentId) return;
      logger.info("Parent lifecycle change requested", { parentId, status, reason });
      await changeLifecycleStatus({
        variables: { parentId, newStatus: status },
      });
    },
    [parentId, changeLifecycleStatus]
  );

  if (!parentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    logger.error("Error loading parent lifecycle:", { error });
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{tc("loadFailed")}</Typography>;
  }

  if (!parent) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.ParentManageStatus]}>
      <ParentLifecycleView parent={parent} isUpdating={isUpdating} onUpdateLifecycle={handleUpdateLifecycle} />
    </RequirePermission>
  );
}
