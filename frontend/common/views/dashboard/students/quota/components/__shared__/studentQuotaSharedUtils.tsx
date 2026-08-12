import { Box } from "@mui/material";
import type { ReactElement } from "react";

export function wrapContextualHelperCardsDefault(children: ReactElement): ReactElement {
  return <Box sx={{ maxWidth: "4xl", mx: "auto" }}>{children}</Box>;
}
