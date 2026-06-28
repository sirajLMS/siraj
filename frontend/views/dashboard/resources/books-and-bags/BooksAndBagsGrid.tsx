"use client";

import { Box, Grid, Typography } from "@mui/material";
import { BookItemCard } from "./BookItemCard";
import type { BooksAndBagsGridProps } from "./booksAndBags.types";

export function BooksAndBagsGrid({ books, labels }: Readonly<BooksAndBagsGridProps>) {
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
            <BookItemCard book={book} labels={labels} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
