import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  toWhatsappConfigMaskedView,
  WhatsappConfigUpdateInputPothosObject,
  WhatsappConfigurationPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-config.pothos";
import { withAuthResult } from "@/backend/graphql/utils";
import { WhatsappConfigService } from "@/backend/services";
import type { WhatsappConfigSeedInput } from "@/backend/types";

/**
 * Persists the deployment-wide WhatsApp Cloud API credentials. The editor is
 * attributed from the authenticated context (never from input), the locale
 * flows through so validation errors come back localized, and the response is
 * the masked configuration view — stored secrets are never echoed back.
 */
gqlSchemaBuilder.mutationFields(t => ({
  updateWhatsappConfiguration: t.field({
    type: WhatsappConfigurationPothosObject,
    description:
      "Creates or updates the WhatsApp Cloud API configuration with per-field merge semantics: provided fields are written, explicit nulls clear them, omitted fields keep their stored values.",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      input: t.arg({ type: WhatsappConfigUpdateInputPothosObject, required: true }),
    },
    resolve: withAuthResult(async (actorUserId, args, _tErrors, locale) => {
      // Omitted input fields stay `undefined` (untouched) and explicit nulls
      // stay `null` (clear) — exactly the merge contract of the service.
      const input: WhatsappConfigSeedInput = {
        appId: args.input.appId,
        appSecret: args.input.appSecret,
        verifyToken: args.input.verifyToken,
        phoneNumberId: args.input.phoneNumberId,
        wabaId: args.input.wabaId,
        accessToken: args.input.accessToken,
        esConfigId: args.input.esConfigId,
      };
      // The service throws typed DomainErrors — `ValidationError` for
      // invalid input, `DatabaseUnavailableError` when the database is
      // unreachable — and both reach clients with their `extensions.code`
      // unchanged; there is nothing to re-wrap by hand here.
      const saved = await WhatsappConfigService.saveConfiguration(input, { actorUserId, locale });
      return toWhatsappConfigMaskedView(saved, "db");
    }),
  }),
}));
