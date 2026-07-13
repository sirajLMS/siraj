"use client";

import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  AccountStatus,
  type CurrencyCode,
  type ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { InfoField } from "@/frontend/common/views/dashboard/profile/parent/sections/InfoField";
import type {
  ParentAdminData,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";

type ParentAccountFormFields = {
  name: string;
  email: string;
  displayCurrency?: CurrencyCode | null;
};

type AccountParentData = Pick<ParentViewData, "name" | "email">;

function resolveAccountStatusLabel(
  accountStatus: string | null | undefined,
  t: ReturnType<typeof useTranslations<"profile.parent">>
): string {
  const normalized = (accountStatus ?? AccountStatus.Activated).toLowerCase();
  return t(`accountStatus.${normalized as "activated" | "deactivated"}`);
}

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly scope?: ProfileScope;
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
      readonly displayCurrency: CurrencyCode | null | undefined;
      readonly adminData?: ParentAdminData | null;
    }
  | {
      readonly mode: "edit";
      readonly scope?: ProfileScope;
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
      readonly register: UseFormRegister<ParentAccountFormFields>;
      readonly control: Control<ParentAccountFormFields>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.parent");
  const { canView } = useProfileFieldAccess({ scope: props.scope });

  if (props.mode === "edit") {
    return (
      <CoreIdentitySection
        mode="edit"
        scope={props.scope}
        name={props.parentData.name}
        avatarUrl={props.avatarUrl}
        sectionTitle={t("sections.account")}
        nameLabel={t("fields.fullName")}
        emailLabel={t("fields.primaryEmail")}
        currencyLabel={t("fields.displayCurrency")}
        register={props.register}
        control={props.control}
      />
    );
  }

  const accountStatusRaw = props.adminData && "accountStatus" in props.adminData ? props.adminData.accountStatus : null;
  const accountStatus = accountStatusRaw ? String(accountStatusRaw) : null;
  const accountStatusContent =
    canView("parent_account") && accountStatus ? (
      <InfoField
        label={t("fields.accountStatus")}
        value={
          <StatusBadge
            category="staffAccount"
            status={accountStatus.toLowerCase()}
            label={resolveAccountStatusLabel(accountStatus, t)}
            size="small"
          />
        }
      />
    ) : null;

  return (
    <CoreIdentitySection
      mode="view"
      scope={props.scope}
      name={props.parentData.name}
      email={props.parentData.email}
      avatarUrl={props.avatarUrl}
      displayCurrency={props.displayCurrency}
      sectionTitle={t("sections.account")}
      nameLabel={t("fields.fullName")}
      emailLabel={t("fields.primaryEmail")}
      currencyLabel={t("fields.displayCurrency")}
      additionalViewContent={accountStatusContent}
    />
  );
}
