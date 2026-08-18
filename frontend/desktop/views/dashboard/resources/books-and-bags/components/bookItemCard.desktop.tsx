"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { AvailabilityStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  BookItemCardProps,
  BooksAndBagsLabels,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";
import { BookItemStatusBadge } from "@/frontend/common/views/dashboard/resources/books-and-bags/components/bookItemBadge";

const statusLabelMap: Record<AvailabilityStatus, keyof BooksAndBagsLabels> = {
  [AvailabilityStatus.Available]: "statusAvailable",
  [AvailabilityStatus.OutOfStock]: "statusOutOfStock",
};

const statusPaletteKey: Record<AvailabilityStatus, "active" | "blocked"> = {
  [AvailabilityStatus.Available]: "active",
  [AvailabilityStatus.OutOfStock]: "blocked",
};

export function BookItemCardDesktop({ book, labels, onDelete }: Readonly<BookItemCardProps>) {
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
    <Paper
      elevation={0}
      sx={theme => ({
        p: 3,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
        minHeight: 120,
        transition: "border-color 0.15s ease",
        "&:hover": { borderColor: theme.palette.primary.main },
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {book.name}
        </Typography>
        <IconButton
          aria-label={labels.ariaDeleteBook}
          onClick={handleDelete}
          sx={theme => ({ color: theme.palette.error.main })}
        >
          <DeleteOutlined />
        </IconButton>
      </Box>
      <BookItemStatusBadge statusLabel={statusLabel} paletteKey={paletteKey} />
    </Paper>
  );
}
