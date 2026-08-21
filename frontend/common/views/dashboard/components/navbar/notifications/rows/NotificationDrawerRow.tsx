"use client";

import type { ReactNode } from "react";
import { NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import { NotificationRowBase } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/NotificationRowBase";
import {
  isClassMetadata,
  isInvoiceMetadata,
  resolveEventVariant,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/notificationRowVariants";
import { RowInvoiceApproveRejectAction } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/RowInvoiceApproveRejectAction";
import { RowRescheduleAction } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/RowRescheduleAction";
import { RowViewEntityAction } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/RowViewEntityAction";
import type {
  NotificationDrawerAlert,
  NotificationsDrawerViewModel,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";

export interface NotificationDrawerRowProps {
  readonly alert: NotificationDrawerAlert;
  readonly vm: NotificationsDrawerViewModel;
}

function buildSecondaryActions(alert: NotificationDrawerAlert, vm: NotificationsDrawerViewModel): ReactNode {
  const { metadata, eventType, deliveryId } = alert;
  const { labels } = vm;

  if (eventType === NotificationEventType.ClassRescheduled && isClassMetadata(metadata)) {
    const classInstanceId = metadata.classInstanceId ?? metadata.entityId;
    return (
      <RowRescheduleAction
        rescheduleLabel={labels.reschedule}
        classInstanceId={classInstanceId}
        onReschedule={vm.handleReschedule}
      />
    );
  }

  if (eventType === NotificationEventType.InvoiceStatusChanged && isInvoiceMetadata(metadata)) {
    if (metadata.proofPending && deliveryId) {
      return (
        <RowInvoiceApproveRejectAction
          approveLabel={labels.approveInvoice}
          rejectLabel={labels.rejectInvoice}
          deliveryId={deliveryId}
          invoiceId={metadata.entityId}
          onApprove={vm.handleApproveInvoice}
          onReject={vm.handleRejectInvoice}
        />
      );
    }

    return <RowViewEntityAction viewLabel={labels.viewEntity} metadata={metadata} onViewEntity={vm.handleViewEntity} />;
  }

  return null;
}

export function NotificationDrawerRow({ alert, vm }: Readonly<NotificationDrawerRowProps>) {
  const variant = resolveEventVariant(alert);
  const secondaryActions = buildSecondaryActions(alert, vm);

  return (
    <NotificationRowBase
      alert={alert}
      markReadLabel={vm.labels.markAsRead}
      icon={variant.icon}
      iconColor={variant.iconColor}
      accentColor={variant.accentColor}
      secondaryActions={secondaryActions}
      onMarkRead={vm.markOneRead}
      onViewEntity={vm.handleViewEntity}
    />
  );
}
