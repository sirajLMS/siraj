import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { MessageSchema } from "@/shared/locale/types/message";

gqlSchemaBuilder.queryFields(t => ({
  welcomeMessage: t.field({
    type: "String",
    resolve: async (_parent, _args, ctx) => {
      const translations = await getServerTranslations(ctx.locale, "common");
      return translations.welcome;
    },
  }),

  translatedMessage: t.field({
    type: "String",
    authScopes: { loggedIn: true },
    args: {
      key: t.arg.string({ required: true }),
      namespace: t.arg.string({ required: true }),
    },
    resolve: async (_parent, { key, namespace }, ctx) => {
      const translations = await getServerTranslations(ctx.locale, namespace as keyof MessageSchema);
      const translationsRecord = translations as Record<string, unknown>;
      return translationsRecord[key] as string;
    },
  }),
}));
