import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type { StudentCreditRow } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { StudentCreditDataGridDesktopProps } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";
import {
  StudentCreditClassesLeftCell,
  StudentCreditQuickActionCell,
} from "@/frontend/desktop/views/dashboard/billing/components/studentCreditDataGridDesktop.parts";

interface BuildStudentCreditDataGridDesktopColumnsParams {
  readonly labels: StudentCreditDataGridDesktopProps["labels"];
  readonly canManage: boolean;
  readonly billingActionsDisabled: boolean;
  readonly sendingReminderId: string | null;
  readonly onSendReminder: (id: string) => void;
}

export function buildStudentCreditDataGridDesktopColumns({
  labels,
  canManage,
  billingActionsDisabled,
  sendingReminderId,
  onSendReminder,
}: Readonly<BuildStudentCreditDataGridDesktopColumnsParams>): GridColDef<StudentCreditRow>[] {
  return [
    {
      field: "studentName",
      headerName: labels.student,
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => (
        <DesktopPersonProfileLinkCell
          name={row.studentName}
          href={studentHref(row.id)}
          avatarSize={40}
          fontWeight={700}
        />
      ),
    },
    {
      field: "parentEmail",
      headerName: labels.parentContact,
      flex: 1.2,
      minWidth: 180,
      renderCell: ({ row }) => <Typography variant="bodyMd">{row.parentEmail}</Typography>,
    },
    {
      field: "planType",
      headerName: labels.planType,
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => <Typography variant="bodyMd">{row.planType}</Typography>,
    },
    {
      field: "classesLeft",
      headerName: labels.classesLeft,
      flex: 0.9,
      minWidth: 130,
      renderCell: ({ row }) => <StudentCreditClassesLeftCell row={row} />,
    },
    {
      field: "status",
      headerName: labels.status,
      flex: 0.9,
      minWidth: 140,
      renderCell: ({ row }) => (
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontWeight: row.status === "negative_balance" ? 700 : 500,
            color: row.status === "negative_balance" ? theme.palette.error.main : theme.palette.onSecondaryContainer,
          })}
        >
          {labels.creditStatusLabels[row.status]}
        </Typography>
      ),
    },
    {
      field: "quickAction",
      headerName: labels.quickAction,
      flex: 0.9,
      minWidth: 140,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <StudentCreditQuickActionCell
          row={row}
          sendReminderLabel={labels.sendReminder}
          enabled={canManage && !billingActionsDisabled}
          isSending={sendingReminderId === row.id}
          onSendReminder={onSendReminder}
        />
      ),
    },
  ];
}
