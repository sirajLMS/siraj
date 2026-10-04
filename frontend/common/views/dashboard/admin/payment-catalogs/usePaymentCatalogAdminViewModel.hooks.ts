import { useMutation, useQuery } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo, useState } from "react";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deactivateSupportedMobileWalletMutationDocument,
  deactivateSupportedOnlineAccountMutationDocument,
  deactivateSupportedPaymentLinkMutationDocument,
  supportedMobileWalletsQueryDocument,
  supportedOnlineAccountsQueryDocument,
  supportedPaymentLinksQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { logger } from "@/frontend/common/utils/logger";
import type {
  PaymentCatalogKind,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import type { PaymentCatalogsLabels } from "@/shared/locale";

type Notifications = ReturnType<typeof useNotifications>;

export function usePaymentCatalogQueries(activeTab: PaymentCatalogKind) {
  const {
    data: walletData,
    loading: walletsLoading,
    refetch: refetchWallets,
  } = useQuery(supportedMobileWalletsQueryDocument, {
    variables: { activeOnly: false, countryCode: null, direction: null },
    skip: activeTab !== "mobileWallet",
  });
  const {
    data: linkData,
    loading: linksLoading,
    refetch: refetchLinks,
  } = useQuery(supportedPaymentLinksQueryDocument, {
    variables: { activeOnly: false, direction: null },
    skip: activeTab !== "paymentLink",
  });
  const {
    data: accountData,
    loading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery(supportedOnlineAccountsQueryDocument, {
    variables: { activeOnly: false, direction: null },
    skip: activeTab !== "onlineAccount",
  });

  const mobileWallets = useMemo(
    () => (walletData?.supportedMobileWallets ?? []) as SupportedMobileWalletFieldsFragment[],
    [walletData?.supportedMobileWallets]
  );
  const paymentLinks = useMemo(
    () => (linkData?.supportedPaymentLinks ?? []) as SupportedPaymentLinkFieldsFragment[],
    [linkData?.supportedPaymentLinks]
  );
  const onlineAccounts = useMemo(
    () => (accountData?.supportedOnlineAccounts ?? []) as SupportedOnlineAccountFieldsFragment[],
    [accountData?.supportedOnlineAccounts]
  );

  const loading =
    (activeTab === "mobileWallet" && walletsLoading) ||
    (activeTab === "paymentLink" && linksLoading) ||
    (activeTab === "onlineAccount" && accountsLoading);

  const refetchActive = async () => {
    if (activeTab === "mobileWallet") await refetchWallets();
    if (activeTab === "paymentLink") await refetchLinks();
    if (activeTab === "onlineAccount") await refetchAccounts();
  };

  return { mobileWallets, paymentLinks, onlineAccounts, loading, refetchActive };
}

interface DeactivateCatalogParams {
  readonly activeTab: PaymentCatalogKind;
  readonly deleteRow: PaymentCatalogRow | null;
  readonly labels: PaymentCatalogsLabels;
  readonly notifications: Notifications;
  readonly refetchActive: () => Promise<void>;
  readonly setDeleteRow: (row: PaymentCatalogRow | null) => void;
}

export function usePaymentCatalogDeactivate({
  activeTab,
  deleteRow,
  labels,
  notifications,
  refetchActive,
  setDeleteRow,
}: DeactivateCatalogParams) {
  const [deactivateWallet] = useMutation(deactivateSupportedMobileWalletMutationDocument);
  const [deactivateLink] = useMutation(deactivateSupportedPaymentLinkMutationDocument);
  const [deactivateAccount] = useMutation(deactivateSupportedOnlineAccountMutationDocument);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteRow?.id) return;
    setIsDeactivating(true);
    try {
      if (activeTab === "mobileWallet") {
        await deactivateWallet({ variables: { id: deleteRow.id } });
      } else if (activeTab === "paymentLink") {
        await deactivateLink({ variables: { id: deleteRow.id } });
      } else if (activeTab === "onlineAccount") {
        await deactivateAccount({ variables: { id: deleteRow.id } });
      } else {
        return;
      }
      notifications.show(labels.deactivateSuccess, { severity: "success" });
      await refetchActive();
    } catch (error) {
      logger.error("Failed to deactivate catalog entry", { error });
      notifications.show(labels.deactivateError, { severity: "error" });
    } finally {
      setIsDeactivating(false);
      setDeleteRow(null);
    }
  };

  return { isDeactivating, handleConfirmDelete };
}
