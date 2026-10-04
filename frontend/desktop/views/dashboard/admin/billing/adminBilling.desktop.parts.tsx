"use client";

import { AccountBalanceWalletOutlined, AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { StudentCreditFooterShared } from "@/frontend/common/views/dashboard/admin/billing/__shared__/studentCreditFooterShared";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { getStudentCreditGridLabels } from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import { DesktopPrimaryPageAction, DesktopSectionPanel, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { StudentCreditDataGridDesktop } from "@/frontend/desktop/views/dashboard/billing/components/studentCreditDataGrid.desktop";
import { Link } from "@/shared/i18n";

export function AdminBillingHeaderActions({
  labels,
  canViewExchangeRates,
  canCreate,
  onManualInvoice,
}: {
  readonly labels: AdminBillingViewModel["labels"];
  readonly canViewExchangeRates?: boolean;
  readonly canCreate: boolean;
  readonly onManualInvoice: () => void;
}) {
  return (
    <>
      {canViewExchangeRates ? (
        <Link href="/billing/exchange-rates" style={{ textDecoration: "none" }}>
          <Button variant="outlined" startIcon={<TimelineOutlined />}>
            {labels.exchangeRatesLink}
          </Button>
        </Link>
      ) : null}
      <Link href="/quotas" style={{ textDecoration: "none" }}>
        <Button variant="outlined" startIcon={<AccountBalanceWalletOutlined />}>
          {labels.quotasLink}
        </Button>
      </Link>
      {canCreate ? (
        <DesktopPrimaryPageAction startIcon={<AddOutlined />} onClick={onManualInvoice}>
          {labels.manualInvoice}
        </DesktopPrimaryPageAction>
      ) : null}
    </>
  );
}

export function StudentCreditSection({
  labels,
  creditRows,
  creditLoading,
  canManage,
  billingActionsDisabled,
  creditFilter,
  onSendReminder,
  onViewAllNegativeBalance,
  onClearCreditFilter,
  sendingReminderId,
}: {
  readonly labels: AdminBillingViewModel["labels"];
  readonly creditRows: AdminBillingViewModel["creditRows"];
  readonly creditLoading?: boolean;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly creditFilter: AdminBillingViewModel["creditFilter"];
  readonly onSendReminder: (id: string) => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly onClearCreditFilter: () => void;
  readonly sendingReminderId?: string | null;
}) {
  const isNegativeFilter = creditFilter === "negative_balance";

  return (
    <DesktopSectionPanel
      id="student-credit-section"
      contentPadding={false}
      title={labels.sections.studentCreditStatus}
      actions={
        isNegativeFilter ? (
          <DesktopStatusBadge category="invoice" status="OVERDUE" label={labels.creditTable.negativeBalance} />
        ) : (
          <DesktopStatusBadge category="invoice" status="OVERDUE" label={labels.requiresAttention} />
        )
      }
      subTitle={isNegativeFilter ? labels.creditTable.showingNegativeBalanceOnly : undefined}
    >
      <StudentCreditDataGridDesktop
        rows={creditRows}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSendReminder={onSendReminder}
        labels={getStudentCreditGridLabels(labels)}
        loading={creditLoading && creditRows.length === 0}
        sendingReminderId={sendingReminderId}
      />
      <StudentCreditFooterShared
        isNegativeFilter={isNegativeFilter}
        clearFilterLabel={labels.creditTable.clearFilter}
        viewAllNegativeBalanceLabel={labels.viewAllNegativeBalance}
        onClearCreditFilter={onClearCreditFilter}
        onViewAllNegativeBalance={onViewAllNegativeBalance}
        config={{ paddingInlineSx: undefined }}
      />
    </DesktopSectionPanel>
  );
}
