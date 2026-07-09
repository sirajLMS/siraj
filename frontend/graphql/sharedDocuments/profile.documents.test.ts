import { describe, expect, test } from "bun:test";
import {
  profileByUserIdQueryDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/profile.documents";

describe("profileByUserIdQueryDocument", () => {
  test("requests assignedStudents fields for teacher admin tab", () => {
    const querySource = profileByUserIdQueryDocument.loc?.source.body ?? "";

    expect(querySource).toContain("assignedStudents");
    expect(querySource).toContain("rows");
    expect(querySource).toContain("className");
    expect(querySource).toContain("studentAvatarUrl");
    expect(querySource).toContain("parentName");
    expect(querySource).toContain("parentAvatarUrl");
    expect(querySource).toContain("totalCount");
  });

  test("requests associatedStudents fields for parent profile", () => {
    const querySource = profileByUserIdQueryDocument.loc?.source.body ?? "";

    expect(querySource).toContain("associatedStudents");
    expect(querySource).toContain("id");
    expect(querySource).toContain("rows");
    expect(querySource).toContain("name");
    expect(querySource).toContain("status");
    expect(querySource).toContain("teacherName");
    expect(querySource).toContain("studentAvatarUrl");
    expect(querySource).toContain("teacherUserId");
    expect(querySource).toContain("teacherAvatarUrl");
    expect(querySource).toContain("totalCount");
  });

  test("includes teacher own profile stats fields", () => {
    const querySource = profileByUserIdQueryDocument.loc?.source.body ?? "";
    expect(querySource).toContain("totalClasses");
    expect(querySource).toContain("teacherOwnProfile");
  });

  test("includes teacher admin profile sensitive metadata fields", () => {
    const querySource = profileByUserIdQueryDocument.loc?.source.body ?? "";
    expect(querySource).toContain("hasZoomPassword");
    expect(querySource).toContain("avgEngagementScore");
    expect(querySource).toContain("nationalId");
    expect(querySource).toContain("qualifications");
  });

  test("updateUserProfile mutation returns full parent admin billing fields", () => {
    const mutationSource = updateUserProfileMutationDocument.loc?.source.body ?? "";
    expect(mutationSource).toContain("parentAdminProfile");
    expect(mutationSource).toContain("invoiceType");
    expect(mutationSource).toContain("feeAmount");
    expect(mutationSource).toContain("paymentMethod");
    expect(mutationSource).toContain("currency");
    expect(mutationSource).toContain("timezone");
    expect(mutationSource).toContain("status");
    expect(mutationSource).toContain("avatarUrl");
  });
});
