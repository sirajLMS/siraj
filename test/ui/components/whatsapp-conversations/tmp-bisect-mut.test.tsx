import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

expect.extend(matchers);

  TestRecipientsPanel,
  type TestRecipientsPanelProps,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import type { WhatsappRecipientViewRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { parsePhoneToE164 } from "@/shared/lib/phone";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  ALLOWED_PHONE,
  PENDING_PHONE,
} from "@/test/ui/components/whatsapp-conversations/whatsappConversationsFixtures";


describe("bisect-probe", () => {
  test("parse", () => {
    console.log("BP", JSON.stringify(parsePhoneToE164("+[PHONE_REDACTED]")));
  });
});
