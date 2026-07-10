"use client";

import { Box, Grid, Typography } from "@mui/material";
import { BookItemCard } from "@/frontend/views/dashboard/resources/books-and-bags/BookItemCard";
import type { BooksAndBagsGridProps } from "@/frontend/views/dashboard/resources/books-and-bags/booksAndBags.types";

export function BooksAndBagsGrid({ books, labels, onDelete }: Readonly<BooksAndBagsGridProps>) {
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
            <BookItemCard book={book} labels={labels} onDelete={onDelete} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
