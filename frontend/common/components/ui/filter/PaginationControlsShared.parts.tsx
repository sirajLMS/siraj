"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  type SxProps,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { rtlFlipIconSx } from "@/frontend/common/utils/rtlFlipIconSx";

interface PageSizeSelectProps {
  readonly pageSize: number;
  readonly pageSizeOptions: readonly number[];
  readonly label: string;
  readonly onChange: (pageSize: number) => void;
}

function PageSizeSelect({ pageSize, pageSizeOptions, label, onChange }: Readonly<PageSizeSelectProps>) {
  const handleChange = (event: SelectChangeEvent<number>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 112 }}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={pageSize} onChange={handleChange}>
        {pageSizeOptions.map(option => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface PaginationNavButtonProps {
  readonly direction: "previous" | "next";
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly buttonSx: SxProps<Theme>;
}

function PaginationNavButton({ direction, label, disabled, onClick, buttonSx }: Readonly<PaginationNavButtonProps>) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  const button = (
    <IconButton size="small" aria-label={label} disabled={disabled} onClick={onClick} sx={buttonSx}>
      <Icon fontSize="small" sx={rtlFlipIconSx} />
    </IconButton>
  );

  return (
    <Tooltip title={label}>
      {disabled ? (
        <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      ) : (
        button
      )}
    </Tooltip>
  );
}

interface PaginationNavLabels {
  readonly rowsPerPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly goToPage: string;
  readonly pageOf: (page: number, pageCount: number) => string;
}

export interface PaginationNavGroupProps {
  readonly page: number;
  readonly safePageCount: number;
  readonly pageInput: string;
  readonly onPageInputChange: (value: string) => void;
  readonly onCommitPageInput: () => void;
  readonly onPageChange: (page: number) => void;
  readonly inputWidth: number;
  readonly navButtonSx: SxProps<Theme>;
  readonly labelSx: SxProps<Theme>;
  readonly pageSize: number;
  readonly pageSizeOptions?: readonly number[];
  readonly showPageSizeSelect: boolean;
  readonly onPageSizeChange?: (pageSize: number) => void;
  readonly labels: PaginationNavLabels;
}

export function PaginationNavGroup(props: Readonly<PaginationNavGroupProps>) {
  const {
    page,
    safePageCount,
    pageInput,
    onPageInputChange,
    onCommitPageInput,
    onPageChange,
    inputWidth,
    navButtonSx,
    labelSx,
    pageSize,
    pageSizeOptions,
    showPageSizeSelect,
    onPageSizeChange,
    labels,
  } = props;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {showPageSizeSelect ? (
        <PageSizeSelect
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions ?? []}
          label={labels.rowsPerPage}
          onChange={nextPageSize => onPageSizeChange?.(nextPageSize)}
        />
      ) : null}

      <PaginationNavButton
        direction="previous"
        label={labels.previousPage}
        disabled={page <= 0 || safePageCount === 0}
        onClick={() => onPageChange(page - 1)}
        buttonSx={navButtonSx}
      />

      <PageNumberInput
        value={pageInput}
        disabled={safePageCount === 0}
        width={inputWidth}
        ariaLabel={labels.goToPage}
        onChange={onPageInputChange}
        onCommit={onCommitPageInput}
      />

      <PaginationNavButton
        direction="next"
        label={labels.nextPage}
        disabled={safePageCount === 0 || page >= safePageCount - 1}
        onClick={() => onPageChange(page + 1)}
        buttonSx={navButtonSx}
      />

      <Typography variant="labelMd" sx={labelSx}>
        {labels.pageOf(page + 1, safePageCount)}
      </Typography>
    </Box>
  );
}

interface PageNumberInputProps {
  readonly value: string;
  readonly disabled: boolean;
  readonly width: number;
  readonly ariaLabel: string;
  readonly onChange: (value: string) => void;
  readonly onCommit: () => void;
}

function PageNumberInput({ value, disabled, width, ariaLabel, onChange, onCommit }: Readonly<PageNumberInputProps>) {
  return (
    <TextField
      size="small"
      value={value}
      disabled={disabled}
      onChange={event => onChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={event => {
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit();
        }
      }}
      slotProps={{
        htmlInput: {
          "aria-label": ariaLabel,
          inputMode: "numeric",
        },
      }}
      sx={{ width, "& .MuiInputBase-input": { textAlign: "center", paddingBlock: 1 } }}
    />
  );
}
