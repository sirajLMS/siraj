import { Box, CircularProgress, Typography } from "@mui/material";
import { Translation, useAppTranslation } from "@/shared/locale";

type LoadingStateProps = {
  readonly size?: number;
  readonly minHeight?: number | string;
  readonly message?: string;
  readonly embedded?: boolean;
};

export function LoadingState({ size, minHeight = "50vh", message, embedded = false }: LoadingStateProps) {
  const tDefault = useAppTranslation(Translation.Common);

  const indicator = (
    <CircularProgress size={size} aria-label={tDefault.loading} sx={theme => ({ color: theme.palette.primary.main })} />
  );

  const caption = message ? (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
      {message}
    </Typography>
  ) : null;

  if (embedded) {
    return (
      <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        {indicator}
        {caption}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight }}>
      {indicator}
      {caption}
    </Box>
  );
}
