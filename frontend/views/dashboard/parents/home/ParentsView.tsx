"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField, type Theme, useMediaQuery } from "@mui/material";
import {
  ExportButton,
  FilterButton,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/components/ui";
import type { ParentDirectoryRow } from "@/frontend/views/dashboard/parents/types/directory";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { ParentCardList, type ParentCardListLabels } from "./ParentCardList";
import { ParentsDataGrid, type ParentsDataGridLabels } from "./ParentsDataGrid";
import { ParentsMetricGrid } from "./ParentsMetricGrid";

interface ParentsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly addParent: string;
  readonly records: string;
  readonly table: ParentsDataGridLabels;
  readonly card: ParentCardListLabels;
}

interface ParentsViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsViewLabels;
  readonly onAddParent: () => void;
  readonly onOpenSettings: (id: string) => void;
  readonly onSearch: (query: string) => void;
}

export function ParentsView({
  metrics,
  rows,
  labels,
  onAddParent,
  onOpenSettings,
  onSearch,
}: Readonly<ParentsViewProps>) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <>
            {!isMobile && (
              <TextField
                size="small"
                placeholder={labels.searchPlaceholder}
                onChange={e => {
                  onSearch(e.target.value);
                }}
                sx={{
                  width: 300,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 10,
                    backgroundColor: theme => theme.palette.background.paper,
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
            <PrimaryPageAction onClick={onAddParent}>{labels.addParent}</PrimaryPageAction>
          </>
        }
      />

      <ParentsMetricGrid metrics={metrics} />

      {isMobile && (
        <TextField
          fullWidth
          size="medium"
          placeholder={labels.searchPlaceholder}
          onChange={e => {
            onSearch(e.target.value);
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: theme => theme.palette.background.paper,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      <SectionPanel
        title={labels.records}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <FilterButton onClick={() => {}} />
            <ExportButton onClick={() => {}} />
          </Box>
        }
      >
        {isMobile ? (
          <ParentCardList rows={rows} labels={labels.card} onOpenSettings={onOpenSettings} />
        ) : (
          <ParentsDataGrid rows={rows} labels={labels.table} onOpenSettings={onOpenSettings} />
        )}
      </SectionPanel>
    </PageContainer>
  );
}
