import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  toWhatsappConfigMaskedView,
  WhatsappConfigUpdateInputPothosObject,
  WhatsappConfigurationPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-config.pothos";
import { withAuthResult } from "@/backend/graphql/utils";
import { ValidationError } from "@/backend/lib/errors";
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
    resolve: withAuthResult(async (actorUserId, args, tErrors, locale) => {
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
      try {
        const saved = await WhatsappConfigService.saveConfiguration(input, { actorUserId, locale });
        return toWhatsappConfigMaskedView(saved, "db");
      } catch (error) {
        // The service signals pre-database validation failures as plain
        // localized errors; re-wrap as a DomainError so extensions.code
        // reaches clients. DatabaseUnavailableError already is one and
        // propagates unchanged.
        if (error instanceof Error && error.message === tErrors.invalidInput) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    }),
  }),
}));
