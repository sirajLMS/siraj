"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

// Filter icon button with outline border matching card radius
const StyledFilterIconButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.outlineVariant}`,
  borderRadius: theme.layout.radius.card,
}));

interface BillingMobileSearchBarProps {
  readonly value: string;
  readonly placeholder: string;
  readonly filterLabel: string;
  readonly onChange: (value: string) => void;
}

export function BillingMobileSearchBar({
  value,
  placeholder,
  filterLabel,
  onChange,
}: Readonly<BillingMobileSearchBarProps>) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={event => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { autoComplete: "off" },
        }}
      />
      <StyledFilterIconButton aria-label={filterLabel}>
        <FilterListOutlined />
      </StyledFilterIconButton>
    </Box>
  );
}
