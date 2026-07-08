import { describe, expect, test } from "bun:test";
import { AppPermission as BackendAppPermission } from "@/backend/enum";
import { mapBackendPermissionsToGraphql } from "@/backend/lib/auth/map-graphql-permissions";

describe("mapBackendPermissionsToGraphql", () => {
  test("maps backend dot-notation keys to GraphQL enum names", () => {
    const mapped = mapBackendPermissionsToGraphql([
      BackendAppPermission.DASHBOARD_VIEW,
      BackendAppPermission.DASHBOARD_VIEW_METRICS,
      BackendAppPermission.SCHEDULE_VIEW_LIST,
    ]);

    expect(mapped).toEqual(["DASHBOARD_VIEW", "DASHBOARD_VIEW_METRICS", "SCHEDULE_VIEW_LIST"]);
  });

  test("passes through already-mapped GraphQL enum names", () => {
    const mapped = mapBackendPermissionsToGraphql(["DASHBOARD_VIEW", "AUTH_LOGIN"]);

    expect(mapped).toEqual(["DASHBOARD_VIEW", "AUTH_LOGIN"]);
  });

  test("drops unknown permission keys", () => {
    const mapped = mapBackendPermissionsToGraphql(["unknown.permission", BackendAppPermission.AUTH_LOGIN]);

    expect(mapped).toEqual(["AUTH_LOGIN"]);
  });
});
