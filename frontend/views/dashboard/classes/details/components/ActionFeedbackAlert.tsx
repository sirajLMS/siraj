import { Alert } from "@mui/material";
import type { ActionFeedbackState } from "../types";

export function ActionFeedbackAlert({ feedbackState }: { readonly feedbackState: ActionFeedbackState | null }) {
  if (!feedbackState) return null;
  return (
    <Alert
      severity={feedbackState.severity}
      sx={theme => ({
        mb: 2,
        [theme.breakpoints.down("lg")]: {
          borderRadius: 0,
          paddingInline: theme.spacing(2),
          borderInlineStart: "none",
          borderInlineEnd: "none",
        },
      })}
    >
      {feedbackState.message}
    </Alert>
  );
}
