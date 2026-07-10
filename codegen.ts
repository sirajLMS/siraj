import type { CodegenConfig } from "@graphql-codegen/cli";

const JSON_SCALAR_TYPE = "unknown"; // Or "JsonValue" if you define it elsewhere
// Inline shape mirrors `LocalizedString = Partial<Record<AppLocale, string>>` from
// `@/shared/types/localized-string` (AppLocale is "ar" | "en" today). Kept inline
// so the generated file is self-contained; canonical type is re-exported from
// `@/frontend/types/localized-string.types` for component consumers.
const LOCALIZED_STRING_TYPE = "Partial<Record<'ar' | 'en', string>>";

const config: CodegenConfig = {
  overwrite: true,
  schema: "./frontend/graphql/generated/schema.graphql",
  documents: ["./frontend/graphql/sharedDocuments/**/*.ts", "./frontend/views/**/*.documents.ts"],
  ignoreNoDocuments: true,
  generates: {
    "./frontend/graphql/generated/gql/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
      },
      plugins: [],
      config: {
        useTypeImports: true,
        avoidOptionals: true,
        enumsAsTypes: false,
        dedupeFragments: true,
        onlyOperationTypes: false,
        inlineFragmentTypes: false,
        extractAllFieldsToTypes: true,
        skipTypeNameForRoot: false,
        allowPartialOutputs: true,
        strictScalars: true,
        defaultScalarType: "unknown",
        scalars: {
          Date: "string",
          DateTime: "string",
          Email: "string",
          JSON: JSON_SCALAR_TYPE,
          LocalizedString: LOCALIZED_STRING_TYPE,
          PhoneNumber: "string",
          StringMap: "Record<string, string>",
        },
      },
    },
    "./frontend/graphql/generated/gql/graphql-types.ts": {
      plugins: ["typescript"],
      config: {
        useTypeImports: true,
        avoidOptionals: true,
        enumsAsTypes: false,
        dedupeFragments: true,
        onlyOperationTypes: false,
        inlineFragmentTypes: false,
        extractAllFieldsToTypes: true,
        skipTypeNameForRoot: false,
        strictScalars: true,
        defaultScalarType: "unknown",
        scalars: {
          Date: "string",
          DateTime: "string",
          Email: "string",
          JSON: JSON_SCALAR_TYPE,
          LocalizedString: LOCALIZED_STRING_TYPE,
          PhoneNumber: "string",
          StringMap: "Record<string, string>",
        },
      },
    },

    "./frontend/graphql/generated/gql/operations.ts": {
      plugins: ["typescript-operations"],
      preset: "import-types",
      presetConfig: {
        typesPath: "./graphql-types.ts",
      },
      config: {
        useTypeImports: true,
        avoidOptionals: true,
        enumsAsTypes: false,
        dedupeFragments: true,
        onlyOperationTypes: false,
        inlineFragmentTypes: false,
        extractAllFieldsToTypes: true,
        skipTypeNameForRoot: false,
        strictScalars: true,
        defaultScalarType: "unknown",
        scalars: {
          Date: "string",
          DateTime: "string",
          Email: "string",
          JSON: JSON_SCALAR_TYPE,
          LocalizedString: LOCALIZED_STRING_TYPE,
          PhoneNumber: "string",
          StringMap: "Record<string, string>",
        },
      },
    },
  },
};

export default config;
