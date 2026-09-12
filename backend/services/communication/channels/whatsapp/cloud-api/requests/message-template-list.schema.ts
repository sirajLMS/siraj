/**
 * Zod schemas for the Graph API list-message-templates response
 * (`GET /{waba_id}/message_templates`). Validating at the fetch boundary keeps
 * Meta's payload from flowing into services as unchecked `unknown`, and shares
 * the wire shape between the account sync and the conversations workspace.
 */
import { z } from "zod";

/** Cursor paging block on Graph API list responses. */
export const graphApiPagingSchema = z
  .object({
    cursors: z
      .object({
        before: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    next: z.string().optional(),
    previous: z.string().optional(),
  })
  .optional();

/** Template component entry — only `type`/`text` are consumed downstream. */
const messageTemplateComponentSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

export const messageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.union([
    z.string().transform(code => ({ code })),
    z.object({
      code: z.string(),
    }),
  ]),
  status: z.string(),
  category: z.string(),
  components: z.array(messageTemplateComponentSchema).optional(),
  created_time: z.string().optional(),
});

export const messageTemplateListSchema = z.object({
  data: z.array(messageTemplateSchema),
  paging: graphApiPagingSchema,
});
