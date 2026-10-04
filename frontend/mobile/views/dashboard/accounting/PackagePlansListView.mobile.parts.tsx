import { EditOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

type PackagePlanRow = PackagePlansListViewModel["rows"][number];

type PackagePlanCardProps = Readonly<{
  row: PackagePlanRow;
  labels: PackagePlansLabels;
  canManagePackages: boolean;
}>;

export function PackagePlanCard({ row, labels, canManagePackages }: PackagePlanCardProps) {
  return (
    <MobileCardListItem variant="rounded" dimmed={!row.active} dimmedOpacity={0.72} interactive={canManagePackages}>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
          {row.displayName}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <StatusBadge
            category="session"
            status={row.active ? "active" : "cancelled"}
            label={row.active ? labels.columns.active : labels.archived}
          />
          {canManagePackages ? (
            <EditOutlined fontSize="small" sx={theme => ({ color: theme.palette.onSurfaceVariant })} aria-hidden />
          ) : null}
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1, justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
          {`${formatAccountingMoney(row.priceAmount)} ${row.currency ?? ""}`}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.hoursUnit(Number(row.creditHours ?? 0).toFixed(0))}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1, justifyContent: "space-between" }}>
        <Typography variant="labelSm" sx={theme => ({ fontFamily: "monospace", color: theme.palette.text.secondary })}>
          {row.codename}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {`#${row.sortOrder ?? 0}`}
        </Typography>
      </Stack>
    </MobileCardListItem>
  );
}
