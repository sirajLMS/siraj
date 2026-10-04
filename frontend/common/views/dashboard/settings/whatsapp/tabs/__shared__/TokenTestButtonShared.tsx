"use client";

import { CheckCircleOutlined, ErrorOutlined, SearchOutlined } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import type { WhatsappTokenTestState } from "@/frontend/common/stores/whatsappTokenTestStore";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Test action button whose color/icon/text reflects the token's test state. */
export function TokenTestButton({
  testing,
  testState,
  disabled,
  labels,
  onTest,
}: Readonly<{
  readonly testing: boolean;
  readonly testState: WhatsappTokenTestState | undefined;
  readonly disabled: boolean;
  readonly labels: WhatsappLabels;
  readonly onTest: () => void;
}>) {
  if (testing) {
    return (
      <Button disabled startIcon={<CircularProgress size={16} />}>
        {labels.testRunning}
      </Button>
    );
  }
  if (testState === "success") {
    return (
      <Button color="success" onClick={onTest} startIcon={<CheckCircleOutlined />}>
        {labels.testPassed}
      </Button>
    );
  }
  if (testState === "failed") {
    return (
      <Button color="error" onClick={onTest} startIcon={<ErrorOutlined />}>
        {labels.testFailed}
      </Button>
    );
  }
  return (
    <Button onClick={onTest} disabled={disabled} startIcon={<SearchOutlined />}>
      {labels.test}
    </Button>
  );
}
