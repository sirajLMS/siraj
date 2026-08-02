"use client";

import { WhatsappConfigLayout } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigLayout";
import type {
  WhatsappConfigTab,
  WhatsappConfigViewSharedProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { NumbersTabDesktop } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop";
import { OptInTabDesktop } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop";
import { TemplatesTabDesktop } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/TemplatesTab.desktop";

export function WhatsappConfigDesktopView(props: Readonly<WhatsappConfigViewSharedProps>) {
  const {
    labels,
    accounts,
    templates,
    loading,
    syncing,
    optInLoading,
    isOptedIn,
    snackbar,
    onDeleteAccount,
    onSetAccessToken,
    onSetTwoStepPin,
    onSyncFromMeta,
    onToggleOptIn,
    onDismissSnackbar,
  } = props;

  return (
    <WhatsappConfigLayout
      {...props}
      pageContainer={
        <DesktopPageContainer>
          <DesktopPageHeader title={labels.page.pageTitle} />
        </DesktopPageContainer>
      }
    >
      {(tab: WhatsappConfigTab) => {
        if (tab === "numbers") {
          return (
            <NumbersTabDesktop
              labels={labels}
              accounts={accounts}
              loading={loading}
              syncing={syncing}
              snackbar={snackbar}
              onDeleteAccount={onDeleteAccount}
              onSetAccessToken={onSetAccessToken}
              onSetTwoStepPin={onSetTwoStepPin}
              onSyncFromMeta={onSyncFromMeta}
              onDismissSnackbar={onDismissSnackbar}
            />
          );
        }

        if (tab === "templates") {
          return (
            <TemplatesTabDesktop
              labels={labels}
              templates={templates}
              loading={loading}
              syncing={syncing}
              onSyncFromMeta={onSyncFromMeta}
            />
          );
        }

        return (
          <OptInTabDesktop
            labels={labels}
            isOptedIn={isOptedIn}
            optInLoading={optInLoading}
            onToggleOptIn={onToggleOptIn}
          />
        );
      }}
    </WhatsappConfigLayout>
  );
}
