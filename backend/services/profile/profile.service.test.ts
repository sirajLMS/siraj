import { describe, expect, test } from "bun:test";
import { isRedirect } from "@/backend/services";

describe("ProfileService helpers", () => {
  test("isRedirect identifies redirect resolutions", () => {
    expect(isRedirect({ redirect: "/dashboard" })).toBe(true);
    expect(
      isRedirect({
        scope: "own",
        mode: "view",
        audience: "teacher",
        actorUserId: "user-1",
        targetUserId: "user-1",
        allowedPermissions: [],
      })
    ).toBe(false);
  });
});
