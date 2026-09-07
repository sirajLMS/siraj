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
    // `notImpersonating` mirrors the sibling env-config mutations: credential
    // rotation performed under an impersonated session must not be attributed
    // to the impersonated user's stored configuration. The scopes are wrapped
    // in `$all` explicitly: the schema builder does not set
    // `scopeAuth.defaultStrategy`, so it defaults to "any" — a bare multi-key
    // map would grant on the FIRST truthy scope (`notImpersonating: true`)
    // without ever evaluating the permission check.
    authScopes: {
      $all: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE, notImpersonating: true },
    },
    args: {
      input: t.arg({ type: WhatsappConfigUpdateInputPothosObject, required: true }),
    },
    resolve: withAuthResult(async (actorUserId, args, _tErrors, locale) => {
      // Omitted input fields stay `undefined` (untouched) and explicit nulls
      // stay `null` (clear) — exactly the merge contract of the service. The
      // input object is structurally the credential-field subset of the seed
      // input, so it spreads as-is.
      const input: WhatsappConfigSeedInput = { ...args.input };
      // The service throws typed DomainErrors — `ValidationError` for
      // invalid input, `DatabaseUnavailableError` when the database is
      // unreachable — and both reach clients with their `extensions.code`
      // unchanged; there is nothing to re-wrap by hand here.
      const saved = await WhatsappConfigService.saveConfiguration(input, { actorUserId, locale });
      return toWhatsappConfigMaskedView(saved, "db");
    }),
  }),
}));
