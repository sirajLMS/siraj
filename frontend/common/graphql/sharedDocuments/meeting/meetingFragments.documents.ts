import { gql } from "@apollo/client";

export const MEETING_PROVIDER_FIELDS = gql`
  fragment MeetingProviderFields on MeetingProvider {
    id
    slug
    name
    description
    instructions
    urlAllowlist
    urlExample
    logoUrl
    fieldSchema {
      requiresMeetingUrl
      supportsAutoGeneration
      supportsUsername
      supportsPassword
      supportsTenantId
    }
    providerKind
    isActive
    createdAt
    updatedAt
  }
`;
