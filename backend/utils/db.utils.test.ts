import { describe, expect, test } from "bun:test";
import { createPgEnumFromEnum, escapeLikeWildcards } from "./db.utils";

describe("db.utils", () => {
  describe("createPgEnumFromEnum", () => {
    test("creates enum successfully from non-empty string enum record", () => {
      enum TestEnum {
        ACTIVE = "active",
        INACTIVE = "inactive",
      }

      const pgEnumObj = createPgEnumFromEnum("test_status_enum", TestEnum);
      expect(pgEnumObj).toBeDefined();
      expect(pgEnumObj.enumName).toBe("test_status_enum");
      expect(pgEnumObj.enumValues).toEqual(["active", "inactive"]);
    });

    test("throws an error when record object is empty", () => {
      const emptyEnum = {};
      expect(() => createPgEnumFromEnum("empty_enum", emptyEnum)).toThrow(
        'Cannot create enum "empty_enum": enum must have at least one value.'
      );
    });
  });

  describe("escapeLikeWildcards", () => {
    test("returns empty string when input is empty string", () => {
      expect(escapeLikeWildcards("")).toBe("");
    });

    test("returns plain string unchanged when no special wildcards exist", () => {
      expect(escapeLikeWildcards("hello world")).toBe("hello world");
    });

    test("escapes percent signs (%)", () => {
      expect(escapeLikeWildcards("100% discount")).toBe("100\\% discount");
    });

    test("escapes underscores (_)", () => {
      expect(escapeLikeWildcards("user_name")).toBe("user\\_name");
    });

    test("escapes backslashes (\\)", () => {
      expect(escapeLikeWildcards("C:\\Program Files")).toBe("C:\\\\Program Files");
    });

    test("escapes mixed special characters in single string", () => {
      expect(escapeLikeWildcards("50%_off\\deal")).toBe("50\\%\\_off\\\\deal");
    });
  });
});
