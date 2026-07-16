"use client";

import { useMutation } from "@apollo/client/react";
import {
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { CatalogImageUpload } from "@/frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
import { TagInput } from "@/frontend/common/components/ui/input/tagInput/TagInput";
import {
  type CountryCode,
  type CurrencyCode,
  IdentifierKind,
  PaymentDirection,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  createSupportedMobileWalletMutationDocument,
  createSupportedOnlineAccountMutationDocument,
  createSupportedPaymentLinkMutationDocument,
  updateSupportedMobileWalletMutationDocument,
  updateSupportedOnlineAccountMutationDocument,
  updateSupportedPaymentLinkMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { type CurrencyOption, getCurrencyOptions } from "@/frontend/common/lib/currency";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { logger } from "@/frontend/common/utils/logger";
import type { CatalogEditDialogProps } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import { useAppTranslation } from "@/shared/locale";

const FORM_ID = "payment-catalog-edit-form";

type CatalogFormValues = {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  instructions: LocalizedString;
  countryCode: CountryCode | "";
  currencyCode: CurrencyCode | "";
  phoneRegion: string;
  urlAllowlist: string[];
  urlExample: string;
  identifierKind: IdentifierKind;
  identifierLabel: LocalizedString;
  supportedDirections: PaymentDirection;
  logoUrl: string;
  isActive: boolean;
};

const emptyLocalized = (): LocalizedString => ({ en: "", ar: "" });

const defaultValues = (): CatalogFormValues => ({
  slug: "",
  name: emptyLocalized(),
  description: emptyLocalized(),
  instructions: emptyLocalized(),
  countryCode: "",
  currencyCode: "",
  phoneRegion: "",
  urlAllowlist: [],
  urlExample: "",
  identifierKind: IdentifierKind.Email,
  identifierLabel: emptyLocalized(),
  supportedDirections: PaymentDirection.Both,
  logoUrl: "",
  isActive: true,
});

function resolveCountry(code: string | null | undefined): CountryType | undefined {
  if (!code) return undefined;
  return countries.find(country => country.code === code);
}

function resolveCurrency(code: string | null | undefined): CurrencyOption | null {
  if (!code) return null;
  return getCurrencyOptions().find(option => option.code === code) ?? null;
}

export function CatalogEditDialog({ open, kind, row, onClose, onSaved }: Readonly<CatalogEditDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
  const notifications = useNotifications();
  const isEdit = Boolean(row?.id);

  const [createWallet, { loading: creatingWallet }] = useMutation(createSupportedMobileWalletMutationDocument);
  const [updateWallet, { loading: updatingWallet }] = useMutation(updateSupportedMobileWalletMutationDocument);
  const [createLink, { loading: creatingLink }] = useMutation(createSupportedPaymentLinkMutationDocument);
  const [updateLink, { loading: updatingLink }] = useMutation(updateSupportedPaymentLinkMutationDocument);
  const [createAccount, { loading: creatingAccount }] = useMutation(createSupportedOnlineAccountMutationDocument);
  const [updateAccount, { loading: updatingAccount }] = useMutation(updateSupportedOnlineAccountMutationDocument);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CatalogFormValues>({
    defaultValues: defaultValues(),
  });

  const isSaving =
    creatingWallet || updatingWallet || creatingLink || updatingLink || creatingAccount || updatingAccount;

  useEffect(() => {
    if (!open) return;
    if (!row) {
      reset(defaultValues());
      return;
    }

    reset({
      slug: row.slug ?? "",
      name: row.name ?? emptyLocalized(),
      description: row.description ?? emptyLocalized(),
      instructions: row.instructions ?? emptyLocalized(),
      countryCode: "countryCode" in row ? ((row.countryCode ?? "") as CountryCode | "") : "",
      currencyCode: "currencyCode" in row ? ((row.currencyCode ?? "") as CurrencyCode | "") : "",
      phoneRegion: "phoneRegion" in row ? (row.phoneRegion ?? "") : "",
      urlAllowlist: "urlAllowlist" in row ? (row.urlAllowlist ?? []) : [],
      urlExample: "urlExample" in row ? (row.urlExample ?? "") : "",
      identifierKind: "identifierKind" in row && row.identifierKind ? row.identifierKind : IdentifierKind.Email,
      identifierLabel: "identifierLabel" in row ? (row.identifierLabel ?? emptyLocalized()) : emptyLocalized(),
      supportedDirections: row.supportedDirections ?? PaymentDirection.Both,
      logoUrl: row.logoUrl ?? "",
      isActive: row.isActive ?? true,
    });
  }, [open, reset, row]);

  const title = useMemo(() => (isEdit ? t.editTitle : t.createTitle), [isEdit, t]);

  const buildSharedInput = (values: CatalogFormValues) => ({
    slug: values.slug,
    name: values.name,
    description: values.description.en || values.description.ar ? values.description : null,
    instructions: values.instructions.en || values.instructions.ar ? values.instructions : null,
    supportedDirections: values.supportedDirections,
    logoUrl: values.logoUrl || null,
    isActive: values.isActive,
  });

  const executeMutation = async (values: CatalogFormValues): Promise<void> => {
    const shared = buildSharedInput(values);
    const editId = isEdit ? row?.id : null;

    if (kind === "mobileWallet") {
      const input = {
        ...shared,
        countryCode: values.countryCode || null,
        currencyCode: values.currencyCode || null,
        phoneRegion: values.phoneRegion || null,
      };
      if (editId) {
        await updateWallet({ variables: { id: editId, input } });
      } else {
        await createWallet({ variables: { input } });
      }
      return;
    }

    if (kind === "paymentLink") {
      const input = { ...shared, urlAllowlist: values.urlAllowlist, urlExample: values.urlExample || null };
      if (editId) {
        await updateLink({ variables: { id: editId, input } });
      } else {
        await createLink({ variables: { input } });
      }
      return;
    }

    const input = {
      ...shared,
      identifierKind: values.identifierKind,
      identifierLabel: values.identifierLabel.en || values.identifierLabel.ar ? values.identifierLabel : null,
    };
    if (editId) {
      await updateAccount({ variables: { id: editId, input } });
    } else {
      await createAccount({ variables: { input } });
    }
  };

  const onSubmit = handleSubmit(async values => {
    const hasName = Boolean(values.name.en?.trim() || values.name.ar?.trim());
    if (!hasName) {
      notifications.show(t.errors.nameRequired, { severity: "error" });
      return;
    }

    try {
      await executeMutation(values);
      await onSaved();
    } catch (error) {
      logger.error("Failed to save catalog entry", { error });
      notifications.show(t.saveError, { severity: "error" });
    }
  });

  const countryCode = useWatch({ control, name: "countryCode" });
  const currencyCode = useWatch({ control, name: "currencyCode" });

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          spacing={2}
          sx={{ pt: 1 }}
          onSubmit={event => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <Controller
            name="slug"
            control={control}
            rules={{ required: t.errors.slugRequired }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t.fields.slug}
                fullWidth
                required
                disabled={isEdit}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <LocalizedStringFormField
            name="name"
            control={control}
            label={t.fields.name}
            required
            errorMessage={errors.name?.message}
          />
          <LocalizedStringFormField name="description" control={control} label={t.fields.description} />
          <LocalizedStringFormField name="instructions" control={control} label={t.fields.instructions} />

          <Controller
            name="supportedDirections"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="supported-directions-label">{t.fields.supportedDirections}</InputLabel>
                <Select {...field} labelId="supported-directions-label" label={t.fields.supportedDirections}>
                  <MenuItem value={PaymentDirection.Payin}>{t.directions.payin}</MenuItem>
                  <MenuItem value={PaymentDirection.Payout}>{t.directions.payout}</MenuItem>
                  <MenuItem value={PaymentDirection.Both}>{t.directions.both}</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          {kind === "mobileWallet" ? (
            <>
              <CountryAutocomplete
                country={resolveCountry(countryCode)}
                onChangeAction={country => setValue("countryCode", country.code as CountryCode)}
                onClearAction={() => setValue("countryCode", "")}
                label={t.fields.countryCode}
                fullWidth
              />
              <CurrencySelect
                currency={resolveCurrency(currencyCode)}
                setCurrencyAction={currency => setValue("currencyCode", currency.code)}
                onClearAction={() => setValue("currencyCode", "")}
                label={t.fields.currencyCode}
                fullWidth
              />
              <Controller
                name="phoneRegion"
                control={control}
                render={({ field }) => <TextField {...field} label={t.fields.phoneRegion} fullWidth />}
              />
            </>
          ) : null}

          {kind === "paymentLink" ? (
            <>
              <Controller
                name="urlAllowlist"
                control={control}
                render={({ field }) => (
                  <TagInput
                    label={t.fields.urlAllowlist}
                    placeholder={t.fields.urlAllowlistHelp}
                    initialTags={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="urlExample"
                control={control}
                render={({ field }) => <TextField {...field} label={t.fields.urlExample} fullWidth />}
              />
            </>
          ) : null}

          {kind === "onlineAccount" ? (
            <>
              <Controller
                name="identifierKind"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="identifier-kind-label">{t.fields.identifierKind}</InputLabel>
                    <Select {...field} labelId="identifier-kind-label" label={t.fields.identifierKind}>
                      <MenuItem value={IdentifierKind.Email}>{t.identifierKinds.email}</MenuItem>
                      <MenuItem value={IdentifierKind.Handle}>{t.identifierKinds.handle}</MenuItem>
                      <MenuItem value={IdentifierKind.EmailOrHandle}>{t.identifierKinds.emailOrHandle}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <LocalizedStringFormField name="identifierLabel" control={control} label={t.fields.identifierLabel} />
            </>
          ) : null}

          <Controller
            name="logoUrl"
            control={control}
            render={({ field }) => (
              <CatalogImageUpload
                imageUrl={field.value || null}
                onImageUrlChangeAction={url => field.onChange(url ?? "")}
                allowUrlFallback
                label={t.fields.logoUrl}
              />
            )}
          />

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                sx={theme => ({
                  justifyContent: "flex-start",
                  gap: 1,
                  color: field.value ? theme.palette.text.primary : theme.palette.text.secondary,
                })}
                control={<Checkbox checked={field.value} onChange={event => field.onChange(event.target.checked)} />}
                label={`${t.fields.isActive}: ${field.value ? t.active : t.inactive}`}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <EntityFormDialogActions
        formId={FORM_ID}
        cancelLabel={t.cancel}
        saveLabel={t.save}
        onClose={onClose}
        isLoading={isSaving}
      />
    </Dialog>
  );
}
