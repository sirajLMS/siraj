import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

import { SessionActivateButtonMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/sessionActivateButton.mobile";
import { makeSessionActivateButtonTests } from "@/test/ui/components/helpers/sessionActivateButtonTests";

afterEach(() => {
  cleanup();
});

describe("SessionActivateButtonMobile", () => {
  const cases = makeSessionActivateButtonTests(SessionActivateButtonMobile);
  for (const tc of cases) {
    test(tc.name, tc.run);
  }
});
