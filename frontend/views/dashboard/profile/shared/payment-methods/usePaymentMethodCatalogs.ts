"use client";

import { useQuery } from "@apollo/client/react";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import type { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  supportedMobileWalletsQueryDocument,
  supportedOnlineAccountsQueryDocument,
  supportedPaymentLinksQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { toPaymentMethodCatalogOptions } from "@/frontend/common/lib/payment-method";
import type { LocalizedString } from "@/shared/types/localized-string";

function isPaymentMethodCatalogRow<T extends { id: string | null; slug: string | null; name: LocalizedString | null }>(
  row: T
): row is T & { id: string; slug: string; name: LocalizedString } {
  return row.id != null && row.slug != null && row.name != null;
}

export function usePaymentMethodCatalogs(direction: PaymentDirection | null) {
  const locale = useLocale();

  const { data: walletData, loading: walletsLoading } = useQuery(supportedMobileWalletsQueryDocument, {
    variables: { activeOnly: true, countryCode: null, direction },
  });
  const { data: linkData, loading: linksLoading } = useQuery(supportedPaymentLinksQueryDocument, {
    variables: { activeOnly: true, direction },
  });
  const { data: accountData, loading: accountsLoading } = useQuery(supportedOnlineAccountsQueryDocument, {
    variables: { activeOnly: true, direction },
  });

  const walletOptions = useMemo(
    () =>
      toPaymentMethodCatalogOptions(
        (walletData?.supportedMobileWallets ?? []).filter(isPaymentMethodCatalogRow),
        locale
      ),
    [locale, walletData?.supportedMobileWallets]
  );
  const paymentLinkOptions = useMemo(
    () =>
      toPaymentMethodCatalogOptions((linkData?.supportedPaymentLinks ?? []).filter(isPaymentMethodCatalogRow), locale),
    [linkData?.supportedPaymentLinks, locale]
  );
  const onlineAccountOptions = useMemo(
    () =>
      toPaymentMethodCatalogOptions(
        (accountData?.supportedOnlineAccounts ?? []).filter(isPaymentMethodCatalogRow),
        locale
      ),
    [accountData?.supportedOnlineAccounts, locale]
  );

  return {
    walletOptions,
    paymentLinkOptions,
    onlineAccountOptions,
    loading: walletsLoading || linksLoading || accountsLoading,
  };
}
