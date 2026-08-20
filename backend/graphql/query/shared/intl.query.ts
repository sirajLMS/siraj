import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

gqlSchemaBuilder.queryFields(t => ({
  welcomeMessage: t.field({
    type: "String",
    authScopes: { loggedIn: true },
    resolve: (_parent, _args, ctx) => {
      return ctx.t().commonTranslations.welcome;
    },
  }),

  translatedMessage: t.field({
    type: "String",
    authScopes: { loggedIn: true },
    args: {
      key: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
      namespace: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: (_parent, { key, namespace }, ctx) => {
      const translations: unknown = ctx.t();
      if (!isRecord(translations)) return key;
      const namespaceTranslations = translations[namespace];
      if (!isRecord(namespaceTranslations)) return key;
      return isString(namespaceTranslations[key]) ? namespaceTranslations[key] : key;
    },
  }),
}));
