import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  GenerateWhatsappVerifyTokenQuery,
  TestWhatsappConnectionQuery,
  UpdateWhatsappConfigurationMutation,
  UpdateWhatsappConfigurationMutationVariables,
  WhatsappConfigurationQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * WhatsApp Cloud API configuration documents: the masked credential view,
 * the per-field merge mutation, the verify-token candidate generator, and
 * the live Meta connection check. Every object selection includes `id` for
 * Apollo cache normalization.
 */

const WHATSAPP_CONFIGURATION_FIELDS = gql`
  fragment WhatsappConfigurationFields on WhatsappConfiguration {
    id
    source
    appId
    appSecret
    verifyToken
    phoneNumberId
    wabaId
    accessToken
    esConfigId
    webhookUrl
  }
`;

const WHATSAPP_CONNECTION_TEST_FIELDS = gql`
  fragment WhatsappConnectionTestResultFields on WhatsappConnectionTestResult {
    id
    success
    message
    phoneNumber
  }
`;

export const whatsappConfigurationQueryDocument: TypedDocumentNode<WhatsappConfigurationQuery> = gql`
  ${WHATSAPP_CONFIGURATION_FIELDS}
  query WhatsappConfiguration {
    whatsappConfiguration {
      ...WhatsappConfigurationFields
    }
  }
`;

export const updateWhatsappConfigurationMutationDocument: TypedDocumentNode<
  UpdateWhatsappConfigurationMutation,
  UpdateWhatsappConfigurationMutationVariables
> = gql`
  ${WHATSAPP_CONFIGURATION_FIELDS}
  mutation UpdateWhatsappConfiguration($input: WhatsappConfigUpdateInput!) {
    updateWhatsappConfiguration(input: $input) {
      ...WhatsappConfigurationFields
    }
  }
`;

export const testWhatsappConnectionQueryDocument: TypedDocumentNode<TestWhatsappConnectionQuery> = gql`
  ${WHATSAPP_CONNECTION_TEST_FIELDS}
  query TestWhatsappConnection {
    testWhatsappConnection {
      ...WhatsappConnectionTestResultFields
    }
  }
`;

export const generateWhatsappVerifyTokenQueryDocument: TypedDocumentNode<GenerateWhatsappVerifyTokenQuery> = gql`
  query GenerateWhatsappVerifyToken {
    generateWhatsappVerifyToken
  }
`;
