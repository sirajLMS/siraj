import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { activateSupportedCurrencyMutationDocument } from "@/frontend/common/graphql/sharedDocuments/billing/currency-catalog.documents";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { logger } from "@/frontend/common/utils/logger";
import type { SupportedCurrencyActivateDialogProps } from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog";
import {
  type ActivateFormValues,
  defaultValues,
  toCountryCodeOrEmpty,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useActivateCurrencyDialog({ open, row, onClose, onSaved }: SupportedCurrencyActivateDialogProps) {
  const t = useAppTranslation(Translation.Dashboard.BillingSupportedCurrencies);
  const notifications = useNotifications();
  const isEdit = Boolean(row?.code);

  const [activateCurrency, { loading: saving }] = useMutation(activateSupportedCurrencyMutationDocument);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ActivateFormValues>({
    defaultValues: defaultValues(),
  });

  const selectedCode = useWatch({ control, name: "code" }) ?? "";
  const currentSymbol = useWatch({ control, name: "symbol" }) ?? "";

  useEffect(() => {
    if (!open) return;
    if (!row) {
      reset(defaultValues());
      return;
    }
    reset({
      code: row.code,
      symbol: row.symbol,
      countryCode: toCountryCodeOrEmpty(row.countryCode),
      decimals: "",
      sortOrder: "",
    });
  }, [open, reset, row]);

  const title = useMemo(() => (isEdit ? t.editTitle : t.activateTitle), [isEdit, t]);

  useEffect(() => {
    if (!selectedCode) return;
    const catalogEntry: CurrencyOption | undefined = getCurrencyByCode(selectedCode);
    if (catalogEntry && !currentSymbol) {
      setValue("symbol", catalogEntry.symbol);
      setValue("countryCode", toCountryCodeOrEmpty(catalogEntry.countryCode));
    }
  }, [selectedCode, currentSymbol, setValue]);

  const onSubmit = handleSubmit(async values => {
    if (!values.code) {
      notifications.show(t.codeRequired, { severity: "error" });
      return;
    }
    if (!values.symbol.trim()) {
      notifications.show(t.symbolRequired, { severity: "error" });
      return;
    }
    try {
      await activateCurrency({
        variables: {
          input: {
            code: values.code,
            symbol: values.symbol.trim(),
            countryCode: values.countryCode || null,
            decimals: values.decimals ? Number(values.decimals) : null,
            sortOrder: values.sortOrder ? Number(values.sortOrder) : null,
          },
        },
      });
      await onSaved();
    } catch (error) {
      logger.error("Failed to save supported currency", { error });
      notifications.show(t.saveError, { severity: "error" });
    }
  });

  return { t, saving, isEdit, control, errors, title, onSubmit, onClose };
}
