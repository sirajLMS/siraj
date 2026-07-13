"use client";

import { useMutation } from "@apollo/client/react";
import { DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, AvailabilityStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { deleteBookMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
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

export function BookItemCard({ book, labels, onDelete }: Readonly<BookItemCardProps>) {
  const [deleteBook] = useMutation(deleteBookMutationDocument);
  const notifications = useNotifications();

  const handleDelete = () => {
    deleteBook({ variables: { id: book.id } })
      .then(() => {
        onDelete(book.id);
        notifications.show(labels.deleteSuccess, {
          severity: "success",
          autoHideDuration: 3000,
        });
      })
      .catch(() => {
        notifications.show(labels.deleteFailed, {
          severity: "error",
          autoHideDuration: 5000,
        });
      });
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
        <RequirePermission permissions={AppPermission.ResourcesDelete}>
          <IconButton
            aria-label="Delete book"
            onClick={handleDelete}
            sx={theme => ({ color: theme.palette.error.main })}
          >
            <DeleteOutlined />
          </IconButton>
        </RequirePermission>
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
    </Paper>
  );
}
