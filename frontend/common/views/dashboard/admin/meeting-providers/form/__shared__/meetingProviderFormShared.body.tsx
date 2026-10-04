"use client";

import { Alert, Box, Stack } from "@mui/material";
import {
  ActionsBar,
  CapabilitiesSection,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.capabilities";
import {
  IdentitySection,
  LogoSection,
  UrlAllowlistSection,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.sections";
import type { FormBodyProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.types";

export function FormBody({
  t,
  control,
  errors,
  isSaving,
  errorMsg,
  isUrlExampleValid,
  onSubmit,
  onCancel,
  slots,
  styles,
  isEdit,
  slugValue,
  isActiveValue,
  urlAllowlistValue,
}: Readonly<FormBodyProps>) {
  return (
    <Box
      component="form"
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
      sx={styles.formSx ?? {}}
    >
      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      <Stack spacing={styles.sectionStackSpacing}>
        <LogoSection t={t} control={control} isSaving={isSaving} slots={slots} styles={styles} />
        <IdentitySection
          t={t}
          control={control}
          errors={errors}
          isSaving={isSaving}
          isEdit={isEdit}
          slots={slots}
          styles={styles}
        />
        <UrlAllowlistSection
          t={t}
          control={control}
          errors={errors}
          isSaving={isSaving}
          isUrlExampleValid={isUrlExampleValid}
          slots={slots}
          styles={styles}
        />
        <CapabilitiesSection
          t={t}
          control={control}
          isSaving={isSaving}
          isActiveValue={isActiveValue}
          slots={slots}
          styles={styles}
        />
        <ActionsBar
          t={t}
          isSaving={isSaving}
          slugValue={slugValue}
          urlAllowlistValue={urlAllowlistValue}
          onCancel={onCancel}
          styles={styles}
        />
      </Stack>
    </Box>
  );
}
