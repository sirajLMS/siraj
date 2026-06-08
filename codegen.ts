import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	overwrite: true,
	schema: "./frontend/graphql/generated/schema.graphql",
	documents: [
		"./frontend/graphql/sharedDocuments/**/*.ts",
		"./frontend/views/**/*.documents.ts",
	],
	ignoreNoDocuments: true,
	generates: {
		"./frontend/graphql/generated/gql/graphql.ts": {
			plugins: ["typescript", "typescript-operations"],
			config: {
				dedupeFragments: true,
				onlyOperationTypes: false,
				enumsAsTypes: false,
				withRefetchFn: true,
				inlineFragmentTypes: false,
				preResolveTypes: true,
				extractAllFieldsToTypes: true,
				skipTypeNameForRoot: false,
				fragmentMasking: false,
				allowPartialOutputs: true,
			},
		},
		"./frontend/graphql/generated/gql/gql.ts": {
			plugins: ["gql-tag-operations"],
			config: {
				dedupeFragments: true,
				onlyOperationTypes: false,
				enumsAsTypes: false,
				withRefetchFn: true,
				inlineFragmentTypes: false,
				preResolveTypes: true,
				extractAllFieldsToTypes: true,
				skipTypeNameForRoot: false,
				fragmentMasking: false,
			},
		},
	},
};

export default config;
