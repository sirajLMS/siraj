import { describe, expect, test } from "bun:test";
import {
  PROFILE_FIELD_GROUP_KEYS,
  profileFieldPermissionKey,
  STUDENT_FIELD_GROUP_KEYS,
  studentFieldPermissionKey,
} from "@/shared/constants/profile-field-groups";
import {
  backendPermissionKeyToGraphqlName,
  profileFieldGroupGraphqlPermission,
  studentFieldGroupGraphqlPermission,
} from "@/shared/lib/field-group-permission-key";

const ACTIONS = ["view_own", "view_other", "edit_own", "edit_other"] as const;

describe("backendPermissionKeyToGraphqlName", () => {
  test("maps profile group keys", () => {
    expect(backendPermissionKeyToGraphqlName("profile.core_identity.view_own")).toBe("PROFILE_CORE_IDENTITY_VIEW_OWN");
    expect(backendPermissionKeyToGraphqlName("profile.payment_methods.edit_other")).toBe(
      "PROFILE_PAYMENT_METHODS_EDIT_OTHER"
    );
  });

  test("maps student group keys", () => {
    expect(backendPermissionKeyToGraphqlName("student.student_identity.view_own")).toBe("STUDENT_IDENTITY_VIEW_OWN");
    expect(backendPermissionKeyToGraphqlName("student.student_history.view_other")).toBe("STUDENT_HISTORY_VIEW_OTHER");
  });
});

describe("profileFieldGroupGraphqlPermission", () => {
  test("covers every profile manifest group and action", () => {
    for (const group of PROFILE_FIELD_GROUP_KEYS) {
      for (const action of ACTIONS) {
        const backendKey = profileFieldPermissionKey(group, action);
        const graphqlName = profileFieldGroupGraphqlPermission(group, action);
        expect(graphqlName).toBe(backendPermissionKeyToGraphqlName(backendKey));
        expect(graphqlName).toMatch(/^PROFILE_[A-Z0-9_]+$/);
      }
    }
  });
});

describe("studentFieldGroupGraphqlPermission", () => {
  test("covers every student manifest group and action", () => {
    for (const group of STUDENT_FIELD_GROUP_KEYS) {
      for (const action of ACTIONS) {
        const backendKey = studentFieldPermissionKey(group, action);
        const graphqlName = studentFieldGroupGraphqlPermission(group, action);
        expect(graphqlName).toBe(backendPermissionKeyToGraphqlName(backendKey));
        expect(graphqlName).toMatch(/^STUDENT_[A-Z0-9_]+$/);
      }
    }
  });
});
