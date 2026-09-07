import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  assertCanViewWhatsappConfig,
  toWhatsappConfigMaskedView,
  WhatsappConfigurationPothosObject,
  WhatsappConnectionTestResultPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-config.pothos";
import { withAuthResult } from "@/backend/graphql/utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { WhatsappConfigService } from "@/backend/services";

/**
 * WhatsApp configuration read surface: the masked credential view, a
 * fast verify-token generator, and the live Meta connection check.
 * `whatsappConfiguration` accepts either WhatsApp permission (checked against
 * the context — see `canViewWhatsappConfig`); the other two fields trigger
 * privileged actions and require the manage permission only.
 */
gqlSchemaBuilder.queryFields(t => ({
  whatsappConfiguration: t.field({
    type: WhatsappConfigurationPothosObject,
    description:
      "Masked view of the active WhatsApp Cloud API configuration. Database values win over WHATSAPP_* environment keys; secrets are always masked.",
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewWhatsappConfig(ctx, tErrors);
      const config = await WhatsappConfigService.resolveConfiguration();
      return toWhatsappConfigMaskedView(config, config.source);
    },
  }),

  generateWhatsappVerifyToken: t.string({
    nullable: false,
    description:
      "Generates a cryptographically secure webhook verify-token candidate (48 hex characters). The value is not persisted — copy it into the Meta developer console and save it via updateWhatsappConfiguration.",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    resolve: withAuthResult(async () => WhatsappConfigService.generateVerifyToken()),
  }),

  testWhatsappConnection: t.field({
    type: WhatsappConnectionTestResultPothosObject,
    description:
      "Runs a lightweight live check against the Meta Graph API with the active credentials and returns the localized outcome. Never throws — failures come back as success: false.",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    resolve: withAuthResult((_actorUserId, _args, _tErrors, locale) => WhatsappConfigService.testConnection(locale)),
  }),
}));
