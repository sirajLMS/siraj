"use client";

import { AccountStatus, type ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminSectionShared } from "@/frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared";
import { InfoField } from "@/frontend/common/views/dashboard/profile/components/__shared__/infoFieldShared";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { Translation, useAppTranslation } from "@/shared/locale";

type SupervisorAdminSectionProps = {
  readonly labels: { readonly baseLabels: { readonly actions: { readonly manageLifecycle: string } } };
} & (
  | {
      readonly mode: "view";
      readonly profile: {
        readonly userId: string;
        readonly name: string;
        readonly email: string | null;
        readonly status: string | null;
      };
    }
  | {
      readonly mode: "edit";
      readonly profile: {
        readonly userId: string;
        readonly name: string;
        readonly email: string | null;
        readonly status: string | null;
      };
    }
);

const SUPERVISOR_STATUS_OPTIONS = [AccountStatus.Activated, AccountStatus.Deactivated] as const;

function getAccountStatusColor(status: string | null): "activated" | "deactivated" {
  return status === AccountStatus.Deactivated ? "deactivated" : "activated";
}

function getStatusLabel(
  status: string | null,
  activatedLabel: string,
  deactivatedLabel: string,
  notSetLabel: string
): string {
  if (status === "ACTIVATED") {
    return activatedLabel;
  }
  if (status === "DEACTIVATED") {
    return deactivatedLabel;
  }
  return status ?? notSetLabel;
}

export function SupervisorAdminSection(props: SupervisorAdminSectionProps) {
  const t = useAppTranslation(Translation.Dashboard.SupervisorPortalProfile);
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canEditStatus } = useProfileFieldAccess({
    scope: undefined as ProfileScope | undefined,
  });

  const { profile } = props;

  const statusLabel = getStatusLabel(
    profile.status,
    t.adminResetPassword.statusActivated,
    t.adminResetPassword.statusDeactivated,
    t.notSet
  );

  return (
    <AdminSectionShared
      mode={props.mode}
      sectionTitle={t.fields.status}
      accountStatusLabel={t.fields.status}
      resetPasswordSuccess={tBase.adminResetPassword.success}
      resetPasswordError={tBase.adminResetPassword.error}
      InfoField={InfoField}
      statusBadgeCategory="staffAccount"
      statusColor={getAccountStatusColor(profile.status)}
      statusLabel={statusLabel}
      editStatusOptions={SUPERVISOR_STATUS_OPTIONS.map(status => ({
        value: status,
        label:
          status === AccountStatus.Activated
            ? t.adminResetPassword.statusActivated
            : t.adminResetPassword.statusDeactivated,
      }))}
      editStatusDefaultValue={profile.status ?? ""}
      canEditStatus={canEditStatus()}
      targetUserId={profile.userId}
      userName={profile.name}
      userEmail={profile.email ?? ""}
    />
  );
}
