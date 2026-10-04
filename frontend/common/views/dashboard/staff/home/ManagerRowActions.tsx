"use client";

import { useMutation } from "@apollo/client/react";
import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { useState } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  managerDirectoryQueryDocument,
  updateManagerProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { executeManagerUpdate } from "@/frontend/common/views/dashboard/staff/home/ManagerRowActions.helpers";
import { DeactivateDialog } from "@/frontend/common/views/dashboard/staff/home/ManagerRowActions.parts";
import type { Manager } from "@/frontend/common/views/dashboard/staff/home/types";
import { useRouter } from "@/shared/i18n/navigation";
import type { StaffDirectoryLabels } from "@/shared/locale";

interface ManagerRowActionsProps {
  readonly labels: StaffDirectoryLabels;
  readonly manager: Manager;
}

export function ManagerRowActions({ labels, manager }: Readonly<ManagerRowActionsProps>) {
  const t = labels;
  const router = useRouter();
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const [updateProfile, { loading: updateLoading }] = useMutation(updateManagerProfileMutationDocument, {
    refetchQueries: [managerDirectoryQueryDocument],
  });

  const handleEditClick = () => {
    router.push(`${profileHrefForUser(manager.userId)}?tab=profile`);
  };

  const handleDeactivateClick = () => {
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateSubmit = () => {
    const newStatus = manager.status === "active" ? AccountStatus.Deactivated : AccountStatus.Activated;
    return executeManagerUpdate(
      updateProfile,
      manager.staffProfileId,
      { hourlyRate: null, name: null, email: null, phone: null, rateCurrency: null, status: newStatus },
      () => setDeactivateDialogOpen(false),
      "Manager status updated",
      { staffProfileId: manager.staffProfileId, newStatus }
    );
  };

  const isDeactivate = manager.status === "active";
  const deactivateLabel = isDeactivate ? t.actions.deactivate : t.actions.activate;

  return (
    <>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <ViewAsUserButton
          variant="icon"
          targetUserId={manager.userId}
          targetUserName={manager.name}
          targetIsSuperAdmin={manager.targetIsSuperAdmin}
        />

        <Tooltip title={t.actions.editProfile}>
          <IconButton size="small" onClick={handleEditClick} aria-label={t.actions.editProfile}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={deactivateLabel}>
          <IconButton
            size="small"
            onClick={handleDeactivateClick}
            aria-label={deactivateLabel}
            sx={theme => ({
              color: isDeactivate ? theme.palette.error.main : theme.palette.success.main,
            })}
          >
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <DeactivateDialog
        labels={labels}
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        onSubmit={handleDeactivateSubmit}
        isDeactivate={isDeactivate}
        manager={manager}
        updateLoading={updateLoading}
      />
    </>
  );
}
