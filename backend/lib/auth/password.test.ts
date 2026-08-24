import { describe, expect, it } from "bun:test";
import { validatePasswordStrength } from "@/backend/lib/auth/password";

describe("validatePasswordStrength", () => {
  it("passes for valid strong password", async () => {
    await expect(validatePasswordStrength("P@ssword123")).resolves.toBeUndefined();
  });

  it("throws when password is too short", async () => {
    await expect(validatePasswordStrength("P@ss12")).rejects.toThrow("Password must be at least 8 characters long.");
  });

  it("throws when password lacks uppercase letter", async () => {
    await expect(validatePasswordStrength("p@ssword123")).rejects.toThrow(
      "Password must contain at least one uppercase letter."
    );
  });

  it("throws when password lacks lowercase letter", async () => {
    await expect(validatePasswordStrength("P@SSWORD123")).rejects.toThrow(
      "Password must contain at least one lowercase letter."
    );
  });

  it("throws when password lacks digit", async () => {
    await expect(validatePasswordStrength("P@sswordabc")).rejects.toThrow(
      "Password must contain at least one digit."
    );
  });

  it("throws when password lacks special character", async () => {
    await expect(validatePasswordStrength("Password123")).rejects.toThrow(
      "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/)."
    );
  });
});
