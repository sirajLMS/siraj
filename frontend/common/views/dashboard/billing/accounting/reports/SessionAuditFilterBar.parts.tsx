import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import { SessionAuditStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { renderStatusValue } from "@/frontend/common/views/dashboard/__shared__";
import {
  isSessionAuditStatus,
  STATUS_CHIP_PREVIEW_LIMIT,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar.helpers";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

interface StatusFilterSelectProps {
  readonly labels: Pick<SessionAuditLabels, "filters" | "status">;
  readonly currentStatuses: readonly SessionAuditStatus[];
  readonly setCurrentStatuses: (statuses: SessionAuditStatus[]) => void;
}

/** Multi-select of audit statuses; chips preview the selection, "all" copy marks an empty one. */
export function StatusFilterSelect({ labels, currentStatuses, setCurrentStatuses }: Readonly<StatusFilterSelectProps>) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selected = typeof value === "string" ? value.split(",") : value;
    setCurrentStatuses(selected.filter(isSessionAuditStatus));
  };
  return (
    <FormControl size="small" sx={{ width: { xs: "100%", lg: "auto" }, flex: { lg: "1 1 0" }, minWidth: { lg: 180 } }}>
      <InputLabel id="session-audit-status-filter-label" shrink>
        {labels.filters.status}
      </InputLabel>
      <Select
        labelId="session-audit-status-filter-label"
        label={labels.filters.status}
        multiple
        displayEmpty
        value={[...currentStatuses]}
        onChange={handleChange}
        renderValue={selected =>
          renderStatusValue(
            selected,
            labels.status,
            labels.filters.statusPlaceholder,
            isSessionAuditStatus,
            STATUS_CHIP_PREVIEW_LIMIT
          )
        }
      >
        {Object.values(SessionAuditStatus).map(status => (
          <MenuItem key={status} value={status}>
            {labels.status[status]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface DateRangeFilterProps {
  readonly labels: SessionAuditLabels["filters"];
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  /** Validation copy shown when the range is inverted; null hides the helper text. */
  readonly invalidRangeMessage: string | null;
  readonly onRangeChange: (dateFrom: string, dateTo: string) => void;
}

/** Date-range picker cell: spans both tablet grid columns and surfaces inverted-range copy inline. */
export function DateRangeFilter({
  labels,
  dateFrom,
  dateTo,
  invalidRangeMessage,
  onRangeChange,
}: Readonly<DateRangeFilterProps>) {
  const showRangePlaceholder = (dateFrom === null || dateFrom === "") && (dateTo === null || dateTo === "");
  return (
    <Box
      sx={{
        position: "relative",
        gridColumn: { sm: "span 2" },
        width: { xs: "100%", lg: "auto" },
        flex: { lg: "1 1 0" },
        minWidth: { lg: 240 },
        // The read-only range trigger carries no start adornment, so MUI keeps
        // its label inside the field until a range is picked while the labeled
        // sibling controls float from the start. Pin the label in the shrunk
        // position and open the outline notch so the control reads like its
        // siblings; the RTL Emotion cache flips the translate X exactly as it
        // does for MUI's own label styles, keeping RTL placement identical.
        "& .MuiInputLabel-root": {
          userSelect: "none",
          pointerEvents: "auto",
          maxWidth: "calc(133% - 32px)",
          transform: "translate(14px, -9px) scale(0.75)",
        },
        "& .MuiOutlinedInput-notchedOutline legend": {
          maxWidth: "100%",
        },
      }}
    >
      <AppDateRangePicker
        label={labels.dateRange}
        fromLabel={labels.dateFrom}
        toLabel={labels.dateTo}
        fromDate={dateFrom ?? ""}
        toDate={dateTo ?? ""}
        onChange={onRangeChange}
        size="small"
      />
      {showRangePlaceholder ? (
        // The trigger is a read-only input without placeholder support; a
        // non-interactive overlay aligned with the input's inline start padding
        // supplies the empty-state hint, hidden as soon as a range is picked.
        <Box
          component="span"
          sx={theme => ({
            position: "absolute",
            insetInlineStart: 14,
            insetBlockStart: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: theme.palette.text.secondary,
            fontSize: "0.8125rem",
            maxWidth: "calc(100% - 48px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {labels.dateRangePlaceholder}
        </Box>
      ) : null}
      {invalidRangeMessage === null ? null : <FormHelperText error>{invalidRangeMessage}</FormHelperText>}
    </Box>
  );
}
