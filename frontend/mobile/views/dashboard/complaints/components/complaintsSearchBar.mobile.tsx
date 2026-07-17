"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledSearchField = styled(TextField)({
  width: "100%",
});

interface ComplaintsSearchBarMobileProps {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}

export function ComplaintsSearchBarMobile({ value, placeholder, onChange }: Readonly<ComplaintsSearchBarMobileProps>) {
  return (
    <StyledSearchField
      size="small"
      value={value}
      placeholder={placeholder}
      onChange={event => {
        onChange(event.target.value);
      }}
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
  );
}
