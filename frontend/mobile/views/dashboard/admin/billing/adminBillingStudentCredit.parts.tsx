"use client";

import { StudentCreditFooterShared } from "@/frontend/common/views/dashboard/admin/billing/__shared__/studentCreditFooterShared";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { MobileSectionPanel, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { StudentCreditCardListMobile } from "@/frontend/mobile/views/dashboard/billing/components/studentCreditCardList.mobile";

export function StudentCreditSection({
  labels,
  creditRows,
  canManage,
  billingActionsDisabled,
  creditFilter,
  creditLoading,
  onSendReminder,
  onViewAllNegativeBalance,
  onClearCreditFilter,
  sendingReminderId,
}: {
  readonly labels: AdminBillingViewModel["labels"];
  readonly creditRows: AdminBillingViewModel["creditRows"];
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly creditFilter: AdminBillingViewModel["creditFilter"];
  readonly creditLoading?: boolean;
  readonly onSendReminder: (id: string) => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly onClearCreditFilter: () => void;
  readonly sendingReminderId?: string | null;
}) {
  return (
    <MobileSectionPanel
      id="student-credit-section"
      title={labels.sections.studentCreditStatus}
      subTitle={creditFilter === "negative_balance" ? labels.creditTable.showingNegativeBalanceOnly : undefined}
      contentInset={false}
      actions={
        creditFilter === "negative_balance" ? (
          <MobileStatusBadge category="invoice" status="OVERDUE" label={labels.creditTable.negativeBalance} />
        ) : undefined
      }
    >
      <StudentCreditCardListMobile
        rows={creditRows}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSendReminder={onSendReminder}
        loading={creditLoading && creditRows.length === 0}
        sendingReminderId={sendingReminderId}
        labels={{
          classesLeft: labels.creditTable.classesLeft,
          sendReminder: labels.creditTable.sendReminder,
          creditStatusLabels: labels.creditStatus,
        }}
      />
      <StudentCreditFooterShared
        isNegativeFilter={creditFilter === "negative_balance"}
        clearFilterLabel={labels.creditTable.clearFilter}
        viewAllNegativeBalanceLabel={labels.viewAllNegativeBalance}
        onClearCreditFilter={onClearCreditFilter}
        onViewAllNegativeBalance={onViewAllNegativeBalance}
        config={{ paddingInlineSx: { px: 2 } }}
      />
    </MobileSectionPanel>
  );
}
