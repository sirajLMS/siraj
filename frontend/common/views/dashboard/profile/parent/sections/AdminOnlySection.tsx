"use client";

import { MenuItem, Stack, TextField, Tooltip } from "@mui/material";
import { useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import { InfoField } from "@/frontend/common/views/dashboard/profile/parent/sections/InfoField";
import type {
  ParentAdminData,
  ParentSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";

type AdminOnlySectionProps = {
  readonly labels: Pick<ParentSectionLabelsBundle, "parent"> & { readonly baseLabels: ProfileSharedBaseLabels };
} & (
  | {
      readonly mode: "view";
      readonly adminData: ParentAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
    }
);

export function AdminOnlySection(props: AdminOnlySectionProps) {
  const t = props.labels.parent;
  const tc = props.labels.baseLabels;
  const { canAdminResetPassword } = useProfileFieldAccess({ scope: undefined });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <TextField
            label={t.fields.accountStatus}
            fullWidth
            size="small"
            select
            {...props.register("lifecycleStatus")}
          >
            <MenuItem value={AccountStatus.Activated}>{t.accountStatus.activated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.accountStatus.deactivated}</MenuItem>
          </TextField>
        </Stack>
      </SectionPanel>
    );
  }

  const { adminData } = props;

  const canResetPassword = canAdminResetPassword();
  const targetUserId = adminData.userId;

  return (
    <Stack>
      <SectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <InfoField
              label={t.fields.accountStatus}
              value={
                <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                  <StatusBadge
                    category="staffAccount"
                    status={adminData.accountStatus === AccountStatus.Activated ? "activated" : "deactivated"}
                    label={
                      adminData.accountStatus === AccountStatus.Activated
                        ? t.accountStatus.activated
                        : t.accountStatus.deactivated
                    }
                  />
                  {canResetPassword && targetUserId && (
                    <Tooltip title={tc.actions.manageLifecycle}>
                      <ResetPasswordDialog
                        open={resetPasswordOpen}
                        onClose={() => setResetPasswordOpen(false)}
                        userName={adminData.name ?? ""}
                        userEmail={adminData.email ?? ""}
                        isLoading={false}
                        sendEmail={sendEmail}
                        setSendEmail={setSendEmail}
                        onConfirm={() => setResetPasswordOpen(false)}
                      />
                    </Tooltip>
                  )}
                </Stack>
              }
            />
          </Stack>
        </Stack>
      </SectionPanel>
      {canResetPassword && targetUserId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={adminData.name ?? ""}
          userEmail={adminData.email ?? ""}
          isLoading={false}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={() => setResetPasswordOpen(false)}
        />
      )}
    </Stack>
  );
}
