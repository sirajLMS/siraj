"use client";

import { Box, Typography } from "@mui/material";
import type {
  BookItem,
  BooksAndBagsGridProps,
} from "@/frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { BookItemCardMobile } from "@/frontend/mobile/views/dashboard/resources/books-and-bags/components/bookItemCard.mobile";

export function BooksAndBagsGridMobile({ books, labels, onDelete }: Readonly<BooksAndBagsGridProps>) {
  if (books.length === 0) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.noEntries}
        </Typography>
      </Box>
    );
  }

  return (
    <MobileCardList<BookItem>
      rows={books}
      getKey={book => book.id}
      emptyMessage={labels.noEntries}
      gap={2}
      layout="rounded"
      renderItem={book => <BookItemCardMobile book={book} labels={labels} onDelete={onDelete} />}
    />
  );
}
