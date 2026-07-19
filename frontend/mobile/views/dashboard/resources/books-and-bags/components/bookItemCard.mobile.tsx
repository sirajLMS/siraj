"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { AvailabilityStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  BookItemCardProps,
  BooksAndBagsLabels,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";

const statusLabelMap: Record<AvailabilityStatus, keyof BooksAndBagsLabels> = {
  [AvailabilityStatus.Available]: "statusAvailable",
  [AvailabilityStatus.OutOfStock]: "statusOutOfStock",
};

const statusPaletteKey: Record<AvailabilityStatus, "active" | "blocked"> = {
  [AvailabilityStatus.Available]: "active",
  [AvailabilityStatus.OutOfStock]: "blocked",
};

export function BookItemCardMobile({ book, labels, onDelete }: Readonly<BookItemCardProps>) {
  // NEW FOR PLAN v5: the inline `useMutation(deleteBookMutationDocument)` +
  // `useNotifications()` + `<RequirePermission permissions={ResourcesDelete}>`
  // previously in this file was lifted to the page-level ViewModel
  // (`useBooksAndBagsViewModel`) per specs.md §3 N1 + N17 + §6.2; deletion
  // here is now a plain prop callback owned by the ViewModel.
  const handleDelete = () => {
    void onDelete(book.id);
  };

  const paletteKey = statusPaletteKey[book.availabilityStatus];
  const statusLabel = labels[statusLabelMap[book.availabilityStatus]];

  return (
    <MobileCardListItem variant="edge-to-edge" interactive sx={{ position: "relative" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {book.name}
        </Typography>
        <IconButton
          aria-label="Delete book"
          onClick={handleDelete}
          size="small"
          sx={theme => ({ color: theme.palette.error.main })}
        >
          <DeleteOutlined />
        </IconButton>
      </Box>
      <Box
        component="span"
        sx={theme => {
          const containerKey = `${paletteKey}Container` as keyof typeof theme.palette.status;
          const onContainerKey =
            `on${paletteKey.charAt(0).toUpperCase()}${paletteKey.slice(1)}Container` as keyof typeof theme.palette.status;
          return {
            display: "inline-flex",
            alignItems: "center",
            px: 1.5,
            py: 0.5,
            borderRadius: theme.layout.radius.badge,
            backgroundColor: theme.palette.status[containerKey],
            color: theme.palette.status[onContainerKey],
            alignSelf: "flex-start",
          };
        }}
      >
        <Typography variant="labelUppercase" sx={{ lineHeight: 1 }}>
          {statusLabel}
        </Typography>
      </Box>
    </MobileCardListItem>
  );
}
