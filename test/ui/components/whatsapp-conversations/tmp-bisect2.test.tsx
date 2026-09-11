import { describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import { parsePhoneToE164 } from "@/shared/lib/phone";

describe("b2", () => {
  test("parse", () => {
    console.log("B2", JSON.stringify(parsePhoneToE164("+201012345678")));
  });
});
