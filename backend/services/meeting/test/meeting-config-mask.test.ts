import { describe, expect, test } from "bun:test";
import {
  buildMaskedClassMeetingConfig,
  buildMaskedClassMeetingConfigs,
} from "@/backend/services/meeting/class-meeting-config-mask";
import {
  buildMaskedMeetingConfig,
  buildMaskedMeetingConfigs,
  buildMeetingProviderCatalogSnapshot,
  maskProviderMetadata,
} from "@/backend/services/meeting/meeting-config-mask";
import type {
  ClassMeetingConfigSelectType,
  MeetingProviderSelectType,
  UserMeetingConfigSelectType,
} from "@/backend/types";

// ---------------------------------------------------------------------------
// Mock Fixtures
// ---------------------------------------------------------------------------

const mockProvider: MeetingProviderSelectType = {
  id: "provider-1",
  slug: "zoom",
  name: { en: "Zoom", ar: "زووم" },
  description: null,
  instructions: null,
  urlAllowlist: ["zoom.us"],
  urlExample: "https://zoom.us/j/123",
  logoUrl: "https://example.com/logo.png",
  fieldSchema: { supportsAutoGeneration: true },
  providerKind: "zoom_oauth",
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const mockUserConfig: UserMeetingConfigSelectType = {
  id: "config-1",
  userId: "user-1",
  providerId: "provider-1",
  label: "Personal Zoom",
  isDefault: true,
  details: { meetingUrl: "https://zoom.us/j/12345" },
  encryptedSecret: "encrypted-secret-key",
  providerMetadata: {
    meetingId: "12345",
    password: "secretpassword123",
    token: "token123",
    refreshToken: "refreshtoken123",
    accessToken: "accesstoken123",
    accountEmail: "user@example.com",
  },
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const mockClassConfig: ClassMeetingConfigSelectType = {
  id: "class-config-1",
  classInstanceId: "class-1",
  recurringScheduleId: null,
  providerId: "provider-1",
  label: "Class Meeting",
  isDefault: false,
  details: { meetingUrl: "https://zoom.us/j/67890" },
  encryptedSecret: "class-secret-key",
  providerMetadata: {
    meetingId: "67890",
    password: "classpassword",
    token: "classtoken",
    refreshToken: "classrefreshtoken",
    accessToken: "classaccesstoken",
    hostId: "host-99",
  },
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

// ---------------------------------------------------------------------------
// Unit Tests: maskProviderMetadata
// ---------------------------------------------------------------------------

describe("maskProviderMetadata", () => {
  describe("nullish and empty inputs", () => {
    test("returns null when metadata is null for non-admin scope", () => {
      expect(maskProviderMetadata(null, false)).toBeNull();
    });

    test("returns null when metadata is undefined for non-admin scope", () => {
      expect(maskProviderMetadata(undefined, false)).toBeNull();
    });

    test("returns null when metadata is null for admin scope", () => {
      expect(maskProviderMetadata(null, true)).toBeNull();
    });

    test("returns null when metadata is undefined for admin scope", () => {
      expect(maskProviderMetadata(undefined, true)).toBeNull();
    });

    test("returns empty object when metadata is empty object for non-admin scope", () => {
      const result = maskProviderMetadata({}, false);
      expect(result).toEqual({});
    });

    test("returns empty object when metadata is empty object for admin scope", () => {
      const result = maskProviderMetadata({}, true);
      expect(result).toEqual({});
    });
  });

  describe("admin scope (isAdminScope = true)", () => {
    test("returns original metadata without masking sensitive fields", () => {
      const metadata = {
        password: "my-secret-password",
        token: "my-token",
        refreshToken: "my-refresh-token",
        accessToken: "my-access-token",
        meetingId: "999888777",
      };

      const result = maskProviderMetadata(metadata, true);
      expect(result).toEqual(metadata);
      expect(result?.password).toBe("my-secret-password");
      expect(result?.token).toBe("my-token");
      expect(result?.refreshToken).toBe("my-refresh-token");
      expect(result?.accessToken).toBe("my-access-token");
    });
  });

  describe("non-admin scope (isAdminScope = false)", () => {
    test("masks all top-level sensitive fields with '***'", () => {
      const metadata = {
        password: "my-secret-password",
        token: "my-token",
        refreshToken: "my-refresh-token",
        accessToken: "my-access-token",
      };

      const result = maskProviderMetadata(metadata, false);
      expect(result).toEqual({
        password: "***",
        token: "***",
        refreshToken: "***",
        accessToken: "***",
      });
    });

    test("preserves non-sensitive fields intact while masking sensitive fields", () => {
      const metadata = {
        meetingId: "123456",
        accountEmail: "teacher@school.org",
        password: "secret-pass",
        scopes: ["user:read", "meeting:write"],
        zoomAccount: { id: "zoom-1" },
        isRecurring: true,
        maxParticipants: 100,
        zeroVal: 0,
        falseVal: false,
        nullVal: null,
      };

      const result = maskProviderMetadata(metadata, false);
      expect(result).toEqual({
        meetingId: "123456",
        accountEmail: "teacher@school.org",
        password: "***",
        scopes: ["user:read", "meeting:write"],
        zoomAccount: { id: "zoom-1" },
        isRecurring: true,
        maxParticipants: 100,
        zeroVal: 0,
        falseVal: false,
        nullVal: null,
      });
    });

    test("masks sensitive fields even when their values are empty strings, null, or undefined", () => {
      const metadata = {
        password: "",
        token: null,
        refreshToken: undefined,
        accessToken: 12345,
      };

      const result = maskProviderMetadata(metadata, false);
      expect(result).toEqual({
        password: "***",
        token: "***",
        refreshToken: "***",
        accessToken: "***",
      });
    });

    test("does not mutate original metadata object (returns shallow copy)", () => {
      const originalMetadata = {
        password: "my-password",
        meetingId: "101",
      };

      const result = maskProviderMetadata(originalMetadata, false);
      expect(result).not.toBe(originalMetadata);
      expect(originalMetadata.password).toBe("my-password");
      expect(result?.password).toBe("***");
    });

    test("does not mask keys with different casing or other unsensitive names", () => {
      const metadata = {
        Password: "unmasked-due-to-casing",
        TOKEN: "unmasked-due-to-casing",
        clientSecret: "unmasked-key-name",
      };

      const result = maskProviderMetadata(metadata, false);
      expect(result).toEqual(metadata);
    });
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: buildMaskedMeetingConfig & buildMaskedMeetingConfigs
// ---------------------------------------------------------------------------

describe("buildMaskedMeetingConfig", () => {
  const providerMap = new Map<string, MeetingProviderSelectType>([
    [mockProvider.id, mockProvider],
  ]);

  test("hides encryptedSecret and masks providerMetadata for non-admin scope", () => {
    const maskedConfig = buildMaskedMeetingConfig(mockUserConfig, false, providerMap);

    expect(maskedConfig.hasSecret).toBe(true);
    expect(maskedConfig.encryptedSecret).toBeNull();
    expect(maskedConfig.providerMetadata).toEqual({
      meetingId: "12345",
      password: "***",
      token: "***",
      refreshToken: "***",
      accessToken: "***",
      accountEmail: "user@example.com",
    });
    expect(maskedConfig.provider).toEqual(mockProvider);
  });

  test("retains encryptedSecret and unmasked providerMetadata for admin scope", () => {
    const maskedConfig = buildMaskedMeetingConfig(mockUserConfig, true, providerMap);

    expect(maskedConfig.hasSecret).toBe(true);
    expect(maskedConfig.encryptedSecret).toBe("encrypted-secret-key");
    expect(maskedConfig.providerMetadata).toEqual(mockUserConfig.providerMetadata);
    expect(maskedConfig.provider).toEqual(mockProvider);
  });

  test("computes hasSecret as false when encryptedSecret is null or empty string", () => {
    const configWithoutSecret: UserMeetingConfigSelectType = {
      ...mockUserConfig,
      encryptedSecret: null,
    };

    const maskedNonAdmin = buildMaskedMeetingConfig(configWithoutSecret, false);
    expect(maskedNonAdmin.hasSecret).toBe(false);

    const maskedAdmin = buildMaskedMeetingConfig(configWithoutSecret, true);
    expect(maskedAdmin.hasSecret).toBe(false);
  });

  test("returns provider as undefined when providerMap is omitted or providerId is not found", () => {
    const resultWithoutMap = buildMaskedMeetingConfig(mockUserConfig, false);
    expect(resultWithoutMap.provider).toBeUndefined();

    const emptyMap = new Map<string, MeetingProviderSelectType>();
    const resultWithEmptyMap = buildMaskedMeetingConfig(mockUserConfig, false, emptyMap);
    expect(resultWithEmptyMap.provider).toBeUndefined();
  });
});

describe("buildMaskedMeetingConfigs", () => {
  const providerMap = new Map<string, MeetingProviderSelectType>([
    [mockProvider.id, mockProvider],
  ]);

  test("masks multiple user meeting configs for non-admin scope", () => {
    const configs = [
      mockUserConfig,
      { ...mockUserConfig, id: "config-2", encryptedSecret: null },
    ];

    const results = buildMaskedMeetingConfigs(configs, false, providerMap);
    expect(results).toHaveLength(2);
    expect(results[0].encryptedSecret).toBeNull();
    expect(results[0].hasSecret).toBe(true);
    expect(results[1].hasSecret).toBe(false);
    expect(results[0].providerMetadata?.password).toBe("***");
    expect(results[1].providerMetadata?.password).toBe("***");
  });

  test("returns empty array when configs input is empty array", () => {
    expect(buildMaskedMeetingConfigs([], false, providerMap)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: buildMaskedClassMeetingConfig & buildMaskedClassMeetingConfigs
// ---------------------------------------------------------------------------

describe("buildMaskedClassMeetingConfig", () => {
  const providerMap = new Map<string, MeetingProviderSelectType>([
    [mockProvider.id, mockProvider],
  ]);

  test("hides encryptedSecret and masks providerMetadata for non-admin scope", () => {
    const maskedConfig = buildMaskedClassMeetingConfig(mockClassConfig, false, providerMap);

    expect(maskedConfig.hasSecret).toBe(true);
    expect(maskedConfig.encryptedSecret).toBeNull();
    expect(maskedConfig.providerMetadata).toEqual({
      meetingId: "67890",
      password: "***",
      token: "***",
      refreshToken: "***",
      accessToken: "***",
      hostId: "host-99",
    });
    expect(maskedConfig.provider).toEqual(mockProvider);
  });

  test("retains encryptedSecret and unmasked providerMetadata for admin scope", () => {
    const maskedConfig = buildMaskedClassMeetingConfig(mockClassConfig, true, providerMap);

    expect(maskedConfig.hasSecret).toBe(true);
    expect(maskedConfig.encryptedSecret).toBe("class-secret-key");
    expect(maskedConfig.providerMetadata).toEqual(mockClassConfig.providerMetadata);
    expect(maskedConfig.provider).toEqual(mockProvider);
  });

  test("computes hasSecret as false when encryptedSecret is null", () => {
    const configWithoutSecret: ClassMeetingConfigSelectType = {
      ...mockClassConfig,
      encryptedSecret: null,
    };

    const masked = buildMaskedClassMeetingConfig(configWithoutSecret, false);
    expect(masked.hasSecret).toBe(false);
  });
});

describe("buildMaskedClassMeetingConfigs", () => {
  const providerMap = new Map<string, MeetingProviderSelectType>([
    [mockProvider.id, mockProvider],
  ]);

  test("masks array of class meeting configs", () => {
    const configs = [mockClassConfig];
    const results = buildMaskedClassMeetingConfigs(configs, false, providerMap);

    expect(results).toHaveLength(1);
    expect(results[0].encryptedSecret).toBeNull();
    expect(results[0].providerMetadata?.password).toBe("***");
  });

  test("returns empty array for empty input array", () => {
    expect(buildMaskedClassMeetingConfigs([], false, providerMap)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: buildMeetingProviderCatalogSnapshot
// ---------------------------------------------------------------------------

describe("buildMeetingProviderCatalogSnapshot", () => {
  test("correctly maps provider fields to catalog snapshot with supportsAutoGeneration = true", () => {
    const snapshot = buildMeetingProviderCatalogSnapshot(mockProvider);

    expect(snapshot).toEqual({
      catalogId: "provider-1",
      catalogSlug: "zoom",
      catalogName: { en: "Zoom", ar: "زووم" },
      logoUrl: "https://example.com/logo.png",
      supportsAutoGeneration: true,
    });
  });

  test("sets supportsAutoGeneration to false when fieldSchema.supportsAutoGeneration is false", () => {
    const provider: MeetingProviderSelectType = {
      ...mockProvider,
      fieldSchema: { supportsAutoGeneration: false },
    };

    const snapshot = buildMeetingProviderCatalogSnapshot(provider);
    expect(snapshot.supportsAutoGeneration).toBe(false);
  });

  test("sets supportsAutoGeneration to false when fieldSchema or supportsAutoGeneration is undefined/null", () => {
    const providerWithoutSchema: MeetingProviderSelectType = {
      ...mockProvider,
      fieldSchema: null,
    };

    const snapshot = buildMeetingProviderCatalogSnapshot(providerWithoutSchema);
    expect(snapshot.supportsAutoGeneration).toBe(false);
  });
});
