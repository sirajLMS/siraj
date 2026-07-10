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
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";
import { CatalogImageUpload } from "@/frontend/components/ui/input/catalogImageUpload/CatalogImageUpload";
import { CountryAutocomplete } from "@/frontend/components/ui/input/countrySelect/CountryAutocomplete";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { LocalizedStringFormField } from "@/frontend/components/ui/input/localizedString/LocalizedStringFormField";
import { TagInput } from "@/frontend/components/ui/input/tagInput/TagInput";
import {
  type CountryCode,
  type CurrencyCode,
  IdentifierKind,
  PaymentDirection,
} from "@/frontend/graphql/generated/gql/graphql-types";
import {
  createSupportedMobileWalletMutationDocument,
  createSupportedOnlineAccountMutationDocument,
  createSupportedPaymentLinkMutationDocument,
  updateSupportedMobileWalletMutationDocument,
  updateSupportedOnlineAccountMutationDocument,
  updateSupportedPaymentLinkMutationDocument,
} from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { type CurrencyOption, getCurrencyOptions } from "@/frontend/lib/currency";
import { type CountryType, countries } from "@/frontend/lib/locale";
import type { CatalogEditDialogProps } from "@/frontend/views/dashboard/admin/payment-catalogs/types";
import { EntityFormDialogActions } from "@/frontend/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";

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
  const t = useTranslations("dashboard.paymentCatalogs");
  const isEdit = Boolean(row?.id);

  const [createWallet, { loading: creatingWallet }] = useMutation(createSupportedMobileWalletMutationDocument);
  const [updateWallet, { loading: updatingWallet }] = useMutation(updateSupportedMobileWalletMutationDocument);
  const [createLink, { loading: creatingLink }] = useMutation(createSupportedPaymentLinkMutationDocument);
  const [updateLink, { loading: updatingLink }] = useMutation(updateSupportedPaymentLinkMutationDocument);
  const [createAccount, { loading: creatingAccount }] = useMutation(createSupportedOnlineAccountMutationDocument);
  const [updateAccount, { loading: updatingAccount }] = useMutation(updateSupportedOnlineAccountMutationDocument);

  const { control, handleSubmit, reset, watch, setValue } = useForm<CatalogFormValues>({
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

  const title = useMemo(() => (isEdit ? t("editTitle") : t("createTitle")), [isEdit, t]);

  const onSubmit = handleSubmit(async values => {
    const shared = {
      slug: values.slug,
      name: values.name,
      description: values.description.en || values.description.ar ? values.description : null,
      instructions: values.instructions.en || values.instructions.ar ? values.instructions : null,
      supportedDirections: values.supportedDirections,
      logoUrl: values.logoUrl || null,
      isActive: values.isActive,
    };

    if (kind === "mobileWallet") {
      const input = {
        ...shared,
        countryCode: values.countryCode || null,
        currencyCode: values.currencyCode || null,
        phoneRegion: values.phoneRegion || null,
      };
      if (isEdit && row?.id) {
        await updateWallet({ variables: { id: row.id, input } });
      } else {
        await createWallet({ variables: { input } });
      }
    }

    if (kind === "paymentLink") {
      const input = {
        ...shared,
        urlAllowlist: values.urlAllowlist,
        urlExample: values.urlExample || null,
      };
      if (isEdit && row?.id) {
        await updateLink({ variables: { id: row.id, input } });
      } else {
        await createLink({ variables: { input } });
      }
    }

    if (kind === "onlineAccount") {
      const input = {
        ...shared,
        identifierKind: values.identifierKind,
        identifierLabel: values.identifierLabel.en || values.identifierLabel.ar ? values.identifierLabel : null,
      };
      if (isEdit && row?.id) {
        await updateAccount({ variables: { id: row.id, input } });
      } else {
        await createAccount({ variables: { input } });
      }
    }

    await onSaved();
  });

  const countryCode = watch("countryCode");
  const currencyCode = watch("currencyCode");

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
            render={({ field }) => (
              <TextField {...field} label={t("fields.slug")} fullWidth required disabled={isEdit} />
            )}
          />

          <LocalizedStringFormField name="name" control={control} label={t("fields.name")} required />
          <LocalizedStringFormField name="description" control={control} label={t("fields.description")} />
          <LocalizedStringFormField name="instructions" control={control} label={t("fields.instructions")} />

          {kind === "mobileWallet" ? (
            <>
              <CountryAutocomplete
                country={resolveCountry(countryCode)}
                onChangeAction={country => setValue("countryCode", country.code as CountryCode)}
                label={t("fields.countryCode")}
                fullWidth
              />
              <CurrencySelect
                currency={resolveCurrency(currencyCode)}
                setCurrencyAction={currency => setValue("currencyCode", currency.code)}
                label={t("fields.currencyCode")}
                fullWidth
              />
              <Controller
                name="phoneRegion"
                control={control}
                render={({ field }) => <TextField {...field} label={t("fields.phoneRegion")} fullWidth />}
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
                    label={t("fields.urlAllowlist")}
                    placeholder={t("fields.urlAllowlistHelp")}
                    initialTags={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="urlExample"
                control={control}
                render={({ field }) => <TextField {...field} label={t("fields.urlExample")} fullWidth />}
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
                    <InputLabel id="identifier-kind-label">{t("fields.identifierKind")}</InputLabel>
                    <Select {...field} labelId="identifier-kind-label" label={t("fields.identifierKind")}>
                      <MenuItem value={IdentifierKind.Email}>{t("identifierKinds.email")}</MenuItem>
                      <MenuItem value={IdentifierKind.Handle}>{t("identifierKinds.handle")}</MenuItem>
                      <MenuItem value={IdentifierKind.EmailOrHandle}>{t("identifierKinds.emailOrHandle")}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <LocalizedStringFormField name="identifierLabel" control={control} label={t("fields.identifierLabel")} />
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
                label={t("fields.logoUrl")}
              />
            )}
          />

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={event => field.onChange(event.target.checked)} />}
                label={t("fields.isActive")}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <EntityFormDialogActions
        formId={FORM_ID}
        cancelLabel={t("cancel")}
        saveLabel={t("save")}
        onClose={onClose}
        isLoading={isSaving}
      />
    </Dialog>
  );
}
