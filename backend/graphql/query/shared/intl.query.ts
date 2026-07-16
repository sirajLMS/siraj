import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

gqlSchemaBuilder.queryFields(t => ({
  welcomeMessage: t.field({
    type: "String",
    resolve: (_parent, _args, ctx) => {
      return ctx.t().commonTranslations.welcome;
    },
  }),

  translatedMessage: t.field({
    type: "String",
    authScopes: { loggedIn: true },
    args: {
      key: t.arg.string({ required: true }),
      namespace: t.arg.string({ required: true }),
    },
    resolve: (_parent, { key, namespace }, ctx) => {
      const translations = ctx.t() as unknown as Record<string, unknown>;
      const namespaceTranslations = translations[namespace] as Record<string, unknown> | undefined;
      return (namespaceTranslations?.[key] as string) ?? key;
    },
  }),
}));
