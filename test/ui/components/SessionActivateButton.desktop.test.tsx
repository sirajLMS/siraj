import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

import { SessionActivateButtonDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/sessionActivateButton.desktop";
import { makeSessionActivateButtonTests } from "@/test/ui/components/helpers/sessionActivateButtonTests";

afterEach(() => {
  cleanup();
});

describe("SessionActivateButtonDesktop", () => {
  const cases = makeSessionActivateButtonTests(SessionActivateButtonDesktop);
  for (const tc of cases) {
    test(tc.name, tc.run);
  }
});
