import { getTranslations } from "next-intl/server";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

gqlSchemaBuilder.queryFields(t => ({
  welcomeMessage: t.field({
    type: "String",
    resolve: async (_parent, _args, _ctx) => {
      // next-intl/server's getTranslations works in API routes
      // It will use the locale determined by getRequestConfig
      const t = await getTranslations("common");
      return t("welcome");
    },
  }),

  translatedMessage: t.field({
    type: "String",
    args: {
      key: t.arg.string({ required: true }),
      namespace: t.arg.string({ required: true }),
    },
    resolve: async (_parent, { key, namespace }) => {
      const t = await getTranslations(namespace);
      return t(key);
    },
  }),
}));
