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
});
