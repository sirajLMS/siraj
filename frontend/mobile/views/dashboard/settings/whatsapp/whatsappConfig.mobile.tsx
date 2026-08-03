"use client";

import { WhatsappConfigLayout } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigLayout";
import type {
  WhatsappConfigTab,
  WhatsappConfigViewSharedProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import { NumbersTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile";
import { OptInTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile";
import { TemplatesTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/TemplatesTab.mobile";

export function WhatsappConfigMobileView(props: Readonly<WhatsappConfigViewSharedProps>) {
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
    onSyncFromMeta,
    onToggleOptIn,
    onDismissSnackbar,
  } = props;

  return (
    <WhatsappConfigLayout
      {...props}
      pageContainer={
        <MobilePageContainer>
          <MobilePageHeader title={labels.page.pageTitle} />
        </MobilePageContainer>
      }
    >
      {(tab: WhatsappConfigTab) => {
        if (tab === "numbers") {
          return (
            <NumbersTabMobile
              labels={labels}
              accounts={accounts}
              loading={loading}
              syncing={syncing}
              snackbar={snackbar}
              onDeleteAccount={onDeleteAccount}
              onSetAccessToken={props.onSetAccessToken}
              onSetTwoStepPin={props.onSetTwoStepPin}
              onSyncFromMeta={onSyncFromMeta}
              onDismissSnackbar={onDismissSnackbar}
            />
          );
        }

        if (tab === "templates") {
          return (
            <TemplatesTabMobile
              labels={labels}
              templates={templates}
              loading={loading}
              syncing={syncing}
              onSyncFromMeta={onSyncFromMeta}
            />
          );
        }

        return (
          <OptInTabMobile
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
