import { describe, expect, test } from "bun:test";
import { profileByUserIdQueryDocument } from "./profile.documents";

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
});
