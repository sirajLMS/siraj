"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Link } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { FilterButton } from "@/frontend/common/components/ui/button/ActionButtons";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { META_WHATSAPP_API_SETUP_URL } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestNumberBanner";
import { TestRecipientsAddDialog } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsAddDialog.parts";
import { TestRecipientsPanelBody } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanelBody.parts";
import type {
  WhatsappRecipientPanelLabels,
  WhatsappRecipientViewRow,
  WhatsappTestNumberBannerLabels,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

export interface TestRecipientsPanelProps {
  readonly labels: WhatsappRecipientPanelLabels;
  readonly bannerLabels: WhatsappTestNumberBannerLabels;
  readonly canManage: boolean;
  readonly rows: readonly WhatsappRecipientViewRow[];
  readonly loading: boolean;
  readonly limitReached: boolean;
  readonly notice: string | null;
  readonly verifyingRecipientId: string | null;
  readonly addOpen: boolean;
  readonly addPhone: string;
  readonly addPhoneValid: boolean;
  readonly addNote: string;
  readonly addError: string | null;
  readonly busy: boolean;
  readonly removeTarget: WhatsappRecipientViewRow | null;
  readonly removeConfirmText: string;
  readonly onOpenAdd: () => void;
  readonly onCloseAdd: () => void;
  readonly onAddPhoneChange: (value: string) => void;
  readonly onAddNoteChange: (value: string) => void;
  readonly onSubmitAdd: () => void;
  readonly onAskRemove: (recipientId: string) => void;
  readonly onCloseRemove: () => void;
  readonly onConfirmRemove: () => void;
  readonly onVerify: (recipientId: string) => void;
}

function MetaDashboardHintLink({ bannerLabels }: Readonly<{ bannerLabels: WhatsappTestNumberBannerLabels }>) {
  return (
    <Box sx={{ py: 1.5, borderTop: theme => `1px dashed ${theme.palette.outlineVariant}` }}>
      <Link
        href={META_WHATSAPP_API_SETUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="bodyMd"
        sx={{ color: theme => theme.palette.info.main }}
      >
        {bannerLabels.metaDashboardLinkText}
      </Link>
    </Box>
  );
}

/**
 * Test-recipient registry panel for Meta test numbers: rows with verification
 * status, verify/remove row actions (manage permission only), the add dialog
 * (blocked once the 5-recipient limit is reached), and a footer hint pointing
 * to the authoritative recipients list in the Meta App Dashboard.
 */
export function TestRecipientsPanel(props: Readonly<TestRecipientsPanelProps>) {
  const { labels, bannerLabels, canManage, limitReached, onOpenAdd } = props;
  return (
    <>
      <SectionPanel
        title={labels.recipientsTitle}
        actions={
          canManage ? (
            <FilterButton size="small" startIcon={<AddOutlined />} onClick={onOpenAdd} disabled={limitReached}>
              {labels.recipientAdd}
            </FilterButton>
          ) : undefined
        }
      >
        <TestRecipientsPanelBody {...props} />
        <MetaDashboardHintLink bannerLabels={bannerLabels} />
      </SectionPanel>
      <TestRecipientsAddDialog
        labels={labels}
        open={props.addOpen}
        phone={props.addPhone}
        phoneValid={props.addPhoneValid}
        note={props.addNote}
        error={props.addError}
        busy={props.busy}
        onClose={props.onCloseAdd}
        onPhoneChange={props.onAddPhoneChange}
        onNoteChange={props.onAddNoteChange}
        onSubmit={props.onSubmitAdd}
      />
      <BaseDeleteDialog
        open={props.removeTarget !== null}
        onClose={props.onCloseRemove}
        onConfirm={props.onConfirmRemove}
        isLoading={props.busy}
        title={labels.removeRecipientDialogTitle}
        body={props.removeConfirmText}
        cancelLabel={labels.dialogCancel}
        confirmLabel={labels.recipientRemove}
        dialogId="whatsapp-remove-test-recipient-dialog"
      />
    </>
  );
}
