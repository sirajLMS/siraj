"use client";

import { useQuery } from "@apollo/client/react";
import {
  Autocomplete,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/components/ui";
import { searchSuggestionsQueryDocument } from "@/frontend/graphql/sharedDocuments/suggestions/suggestion.documents";
import type { SearchResult } from "@/frontend/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionMarkDuplicateDialogProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";

const MIN_SEARCH_LENGTH = 2;

export function SuggestionMarkDuplicateDialog({
  open,
  suggestionId,
  isLoading,
  labels,
  onConfirm,
  onCancel,
}: Readonly<SuggestionMarkDuplicateDialogProps>) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<SearchResult | null>(null);
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setSelectedOption(null);
      setActiveSearchTerm("");
    }
  }, [open]);

  const shouldSearch = activeSearchTerm.trim().length >= MIN_SEARCH_LENGTH;

  const { data: searchData, loading: isSearching } = useQuery(searchSuggestionsQueryDocument, {
    variables: { query: activeSearchTerm.trim(), excludeId: suggestionId },
    skip: !shouldSearch || !open,
  });

  const searchResults: readonly SearchResult[] = searchData?.searchSuggestions ?? [];

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSelectedOption(null);
    if (value.trim().length >= MIN_SEARCH_LENGTH) {
      setActiveSearchTerm(value.trim());
    }
  };

  const handleSubmit = () => {
    if (!selectedOption?.id) return;
    onConfirm(suggestionId, selectedOption.id);
  };

  const handleCancel = () => {
    setSearchInput("");
    setSelectedOption(null);
    onCancel();
  };

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{labels.duplicateTitle}</DialogTitle>
      <DialogContent>
        <Autocomplete<SearchResult>
          fullWidth
          getOptionLabel={option => option.body ?? ""}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          options={[...searchResults]}
          loading={isSearching}
          value={selectedOption}
          onChange={(_event, newValue) => {
            setSelectedOption(newValue);
          }}
          inputValue={searchInput}
          onInputChange={(_event, newInputValue) => {
            handleSearchChange(newInputValue);
          }}
          renderOption={({ key, ...props }, option) => {
            const liProps = { ...props } as Record<string, unknown>;
            delete liProps.id;
            return (
              <Box component="li" key={key} {...liProps} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
                  {option.parentName ?? ""}
                </Typography>
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {option.body ?? ""}
                </Typography>
              </Box>
            );
          }}
          renderInput={params => (
            <TextField
              {...params}
              placeholder={labels.duplicateSearchPlaceholder}
              slotProps={{ htmlInput: { ...params.slotProps.htmlInput, autoComplete: "off" } }}
            />
          )}
          noOptionsText={labels.duplicateNoneFound}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <FilterButton onClick={handleCancel} disabled={isLoading}>
          {labels.cancel}
        </FilterButton>
        <PrimaryPageAction onClick={handleSubmit} disabled={isLoading || !selectedOption?.id}>
          {isLoading ? "..." : labels.duplicateAction}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
