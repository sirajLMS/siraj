import { describe, expect, it } from "bun:test";
import type {
  AccessTokenFormValues,
  AccountCreateFormValues,
  AccountCredentialFormValues,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateAccessToken,
  validateAccessTokenForm,
  validateAccountCreateForm,
  validateCredentialForm,
  validateDisplayName,
  validatePhoneNumberId,
  validateTwoStepPin,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";

describe("validateDisplayName", () => {
  it("returns error key for empty string", () => {
    expect(validateDisplayName("")).toBe("validationDisplayNameRequired");
  });

  it("returns error key for whitespace-only string", () => {
    expect(validateDisplayName("   ")).toBe("validationDisplayNameRequired");
  });

  it("returns error key for string exceeding 100 characters", () => {
    const longName = "a".repeat(101);
    expect(validateDisplayName(longName)).toBe("validationDisplayNameTooLong");
  });

  it("returns null for valid display name", () => {
    expect(validateDisplayName("My Account")).toBeNull();
  });

  it("returns null for display name with exactly 100 characters", () => {
    const maxLengthName = "a".repeat(100);
    expect(validateDisplayName(maxLengthName)).toBeNull();
  });
});

describe("validatePhoneNumberId", () => {
  it("returns error key for empty string", () => {
    expect(validatePhoneNumberId("")).toBe("validationPhoneNumberIdRequired");
  });

  it("returns error key for whitespace-only string", () => {
    expect(validatePhoneNumberId("  ")).toBe("validationPhoneNumberIdRequired");
  });

  it("returns error key for non-numeric string", () => {
    expect(validatePhoneNumberId("abc123def")).toBe("validationPhoneNumberIdNumeric");
  });

  it("returns error key for alphanumeric mix", () => {
    expect(validatePhoneNumberId("123abc")).toBe("validationPhoneNumberIdNumeric");
  });

  it("returns null for valid numeric ID", () => {
    expect(validatePhoneNumberId("123456789")).toBeNull();
  });
});

describe("validateWabaId", () => {
  it("returns error key for empty string", () => {
    expect(validateWabaId("")).toBe("validationWabaIdRequired");
  });

  it("returns error key for whitespace-only string", () => {
    expect(validateWabaId(" ")).toBe("validationWabaIdRequired");
  });

  it("returns error key for non-numeric string", () => {
    expect(validateWabaId("waba123")).toBe("validationWabaIdNumeric");
  });

  it("returns null for valid numeric ID", () => {
    expect(validateWabaId("987654321")).toBeNull();
  });
});

describe("validateAccessToken", () => {
  it("returns null for empty string (optional field)", () => {
    expect(validateAccessToken("")).toBeNull();
  });

  it("returns error key for token shorter than 50 characters", () => {
    const shortToken = "a".repeat(49);
    expect(validateAccessToken(shortToken)).toBe("validationAccessTokenTooShort");
  });

  it("returns null for token with exactly 50 characters", () => {
    const validToken = "a".repeat(50);
    expect(validateAccessToken(validToken)).toBeNull();
  });

  it("returns null for token longer than 50 characters", () => {
    const longToken = "a".repeat(100);
    expect(validateAccessToken(longToken)).toBeNull();
  });
});

describe("validateTwoStepPin", () => {
  it("returns error key for PIN with 5 digits", () => {
    expect(validateTwoStepPin("12345")).toBe("validationPinFormat");
  });

  it("returns error key for PIN with 7 digits", () => {
    expect(validateTwoStepPin("1234567")).toBe("validationPinFormat");
  });

  it("returns error key for non-digit PIN", () => {
    expect(validateTwoStepPin("abcdef")).toBe("validationPinFormat");
  });

  it("returns error key for empty PIN", () => {
    expect(validateTwoStepPin("")).toBe("validationPinFormat");
  });

  it("returns error key for PIN with letters and digits", () => {
    expect(validateTwoStepPin("12ab56")).toBe("validationPinFormat");
  });

  it("returns null for valid 6-digit PIN", () => {
    expect(validateTwoStepPin("123456")).toBeNull();
  });
});

describe("validateAccountCreateForm", () => {
  it("returns all nulls for valid inputs", () => {
    const values: AccountCreateFormValues = {
      displayName: "Test Account",
      phoneNumberId: "123456789",
      wabaId: "987654321",
    };
    const result = validateAccountCreateForm(values);
    expect(result.displayName).toBeNull();
    expect(result.phoneNumberId).toBeNull();
    expect(result.wabaId).toBeNull();
  });

  it("returns error keys for all invalid inputs", () => {
    const values: AccountCreateFormValues = {
      displayName: "",
      phoneNumberId: "abc",
      wabaId: "xyz",
    };
    const result = validateAccountCreateForm(values);
    expect(result.displayName).toBe("validationDisplayNameRequired");
    expect(result.phoneNumberId).toBe("validationPhoneNumberIdNumeric");
    expect(result.wabaId).toBe("validationWabaIdNumeric");
  });
});

describe("validateAccessTokenForm", () => {
  it("returns null for empty access token", () => {
    const values: AccessTokenFormValues = { accessToken: "" };
    const result = validateAccessTokenForm(values);
    expect(result.accessToken).toBeNull();
  });

  it("returns error key for short access token", () => {
    const values: AccessTokenFormValues = { accessToken: "a".repeat(49) };
    const result = validateAccessTokenForm(values);
    expect(result.accessToken).toBe("validationAccessTokenTooShort");
  });

  it("returns null for valid access token", () => {
    const values: AccessTokenFormValues = { accessToken: "a".repeat(50) };
    const result = validateAccessTokenForm(values);
    expect(result.accessToken).toBeNull();
  });
});

describe("validateCredentialForm", () => {
  it("returns error key for invalid PIN", () => {
    const values: AccountCredentialFormValues = { twoStepPin: "12345" };
    const result = validateCredentialForm(values);
    expect(result.twoStepPin).toBe("validationPinFormat");
  });

  it("returns null for valid 6-digit PIN", () => {
    const values: AccountCredentialFormValues = { twoStepPin: "123456" };
    const result = validateCredentialForm(values);
    expect(result.twoStepPin).toBeNull();
  });
});
