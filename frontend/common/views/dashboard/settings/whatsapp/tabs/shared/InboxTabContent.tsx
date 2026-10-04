"use client";

import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import {
  DeclinedEmptyState,
  DeclinedSyncBanner,
  EmptyStateCard,
  ReadOnlyBanner,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/InboxTabContent.parts";
import { textDirection } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/textDirection";
import type { WhatsappInboxViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappInboxView.types";

export interface InboxTabContentProps extends WhatsappInboxViewModel {
  /** Platform list section — desktop AppDataGrid, mobile MobileCardList. */
  readonly children?: ReactNode;
}

const ALL_ACCOUNTS_VALUE = "__all__";

/**
 * Shared inbox tab scaffold: title/subtitle, the account filter select and
 * contact search bar, the load-error Alert, and the read-only notice. Tier
 * files pass their list/thread layout through `children`.
 */
export function InboxTabContent({
  labels,
  accounts,
  accountFilter,
  search,
  queryError,
  conversations,
  loading,
  historyDeclined,
  onAccountFilterChange,
  onSearchChange,
  onRetry,
  children,
}: Readonly<InboxTabContentProps>) {
  // An active client-side search narrowing the page to zero rows keeps the
  // list's own no-rows message — the rich empty card is for a truly empty inbox.
  const inboxEmpty = !loading && !queryError && conversations.length === 0 && search.trim() === "";
  // A declined-but-non-empty inbox keeps its list below the banner; only a
  // declined AND empty inbox swaps the list for the dedicated declined block.
  const showList = !inboxEmpty;
  return (
    <Stack spacing={3}>
      <Box sx={mobileContentGutterBelowMdSx}>
        <Typography variant="titleLg">{labels.title}</Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
          {labels.subtitle}
        </Typography>
      </Box>

      <Box sx={mobileContentGutterBelowMdSx}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { xs: "stretch", md: "center" } }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="whatsapp-inbox-account-filter">{labels.accountFilterLabel}</InputLabel>
            <Select
              labelId="whatsapp-inbox-account-filter"
              value={accountFilter ?? ALL_ACCOUNTS_VALUE}
              label={labels.accountFilterLabel}
              onChange={event =>
                onAccountFilterChange(event.target.value === ALL_ACCOUNTS_VALUE ? null : event.target.value)
              }
            >
              <MenuItem value={ALL_ACCOUNTS_VALUE}>{labels.accountFilterAll}</MenuItem>
              {accounts.map(account => (
                <MenuItem
                  key={account.id}
                  value={account.id}
                  dir={textDirection(account.label)}
                  sx={{ unicodeBidi: "isolate" }}
                >
                  {account.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }}>
            <SearchBarField value={search} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
          </Box>
        </Stack>
      </Box>

      {queryError && (
        <Alert
          severity="error"
          component="div"
          sx={mobileContentGutterBelowMdSx}
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              {labels.retry}
            </Button>
          }
        >
          {labels.loadErrorDescription}
        </Alert>
      )}

      {historyDeclined && <DeclinedSyncBanner labels={labels} />}

      {inboxEmpty && historyDeclined && <DeclinedEmptyState labels={labels} />}

      {inboxEmpty && !historyDeclined && (
        <>
          <EmptyStateCard labels={labels} />
          <ReadOnlyBanner labels={labels} />
        </>
      )}

      {showList && (
        <>
          <ReadOnlyBanner labels={labels} />
          {children}
        </>
      )}
    </Stack>
  );
}
