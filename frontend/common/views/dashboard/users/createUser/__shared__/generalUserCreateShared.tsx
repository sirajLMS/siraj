"use client";

import { useQuery } from "@apollo/client/react";
import { Grid } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { permissionGroupsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  AccountStatusField,
  EmailField,
  NameField,
  PhoneField,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.fields.parts";
import { FormActions } from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.formActions.parts";
import type {
  GeneralUserCreateSharedOptions,
  PermissionGroupOption,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.helpers";
import { PasswordField } from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.passwordField.parts";
import { PermissionGroupField } from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.permissionGroupField.parts";
import type { UseGeneralUserCreateViewModel } from "@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel";
import { SPECIALIZED_GROUP_SLUG_SET } from "@/shared/constants/specialized-groups.constants";
import { useRouter } from "@/shared/i18n/navigation";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export type { GeneralUserCreateSharedOptions } from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.helpers";

export function GeneralUserCreateShared({
  form,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  submitError,
  labels,
  onSubmit,
  onDismissSuccess,
  onDismissError,
  options,
}: Readonly<
  Pick<
    UseGeneralUserCreateViewModel,
    | "form"
    | "control"
    | "errors"
    | "handleSubmit"
    | "isSubmitting"
    | "showSuccess"
    | "submitError"
    | "labels"
    | "onSubmit"
    | "onDismissSuccess"
    | "onDismissError"
  > & {
    readonly options: GeneralUserCreateSharedOptions;
  }
>) {
  const router = useRouter();
  const locale = useAppLocale();

  const { data: groupsData, loading: groupsLoading } = useQuery(permissionGroupsQueryDocument);

  const permissionGroupOptions: PermissionGroupOption[] = (groupsData?.permissionGroups ?? []).flatMap(group => {
    const slug = group?.slug;
    if (!slug) return [];
    if (SPECIALIZED_GROUP_SLUG_SET.has(slug)) return [];
    return [{ slug, name: resolveLocalizedString(group.name, locale) }];
  });

  const handleCancel = () => {
    router.push("/users");
  };

  const { SectionPanel, FormSuccessSnackbar, FormErrorSnackbar, formGap } = options;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={e => {
          void handleSubmit(onSubmit)(e);
        }}
        style={{ display: "flex", flexDirection: "column", gap: formGap }}
      >
        <SectionPanel title={labels.sections.userDetails}>
          <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
            <NameField control={control} errors={errors} labels={labels} />
            <EmailField control={control} errors={errors} labels={labels} />
            <PhoneField control={control} errors={errors} labels={labels} />
            <PasswordField control={control} errors={errors} labels={labels} />
          </Grid>
        </SectionPanel>

        <SectionPanel title={labels.sections.permissions}>
          <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
            <PermissionGroupField
              control={control}
              errors={errors}
              labels={labels}
              options={permissionGroupOptions}
              loading={groupsLoading}
            />
            <AccountStatusField control={control} errors={errors} labels={labels} />
          </Grid>
        </SectionPanel>

        <FormActions labels={labels} isSubmitting={isSubmitting} options={options} onCancel={handleCancel} />

        <FormSuccessSnackbar open={showSuccess} message={labels.createSuccess} onClose={onDismissSuccess} />
        {FormErrorSnackbar ? (
          <FormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
        ) : null}
      </form>
    </FormProvider>
  );
}
