"use client";

import { Box, Grid, Typography } from "@mui/material";
import type { BooksAndBagsGridProps } from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";
import { BookItemCardDesktop } from "@/frontend/desktop/views/dashboard/resources/books-and-bags/components/bookItemCard.desktop";

export function BooksAndBagsGridDesktop({ books, labels, onDelete }: Readonly<BooksAndBagsGridProps>) {
  if (books.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, py: 4, textAlign: "center" })}>
        {labels.noEntries}
      </Typography>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {books.map(book => (
          <Grid key={book.id} size={{ xs: 12, md: 6 }}>
            <BookItemCardDesktop book={book} labels={labels} onDelete={onDelete} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
