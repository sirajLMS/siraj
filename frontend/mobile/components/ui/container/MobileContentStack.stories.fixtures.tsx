import { Box, Card, CardContent, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function CardItem({
  index,
  variant = "outlined",
  children,
}: Readonly<{ index: number; variant?: "outlined" | "elevation"; children?: ReactNode }>) {
  return (
    <Card variant={variant} sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="bodyMd">{children ?? `Card Item ${index}`}</Typography>
      </CardContent>
    </Card>
  );
}

export function FormItem({ index }: Readonly<{ index: number }>) {
  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <TextField label={`Field ${index}`} placeholder={`Enter value ${index}`} fullWidth size="small" />
    </Box>
  );
}

export function MixedContentItem({ index, type }: Readonly<{ index: number; type: "card" | "form" | "text" }>) {
  switch (type) {
    case "card":
      return (
        <CardItem index={index} variant="elevation">
          Elevated Card Content
        </CardItem>
      );
    case "form":
      return <FormItem index={index} />;
    case "text":
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            Plain text content item {index}
          </Typography>
        </Box>
      );
    default:
      return <CardItem index={index} />;
  }
}

export function CardItemsList({
  count,
  variant,
  children,
}: Readonly<{ count: number; variant: "outlined" | "elevation"; children?: ReactNode }>) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => i + 1).map(index => (
        <CardItem key={index} index={index} variant={variant}>
          {children}
        </CardItem>
      ))}
    </>
  );
}
