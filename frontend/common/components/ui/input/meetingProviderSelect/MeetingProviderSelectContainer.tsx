"use client";

import { useQuery } from "@apollo/client/react";
import type * as React from "react";
import {
  MeetingProviderSelect,
  type MeetingProviderSelectProps,
} from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import { meetingProvidersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";

export type MeetingProviderSelectContainerProps = Omit<MeetingProviderSelectProps, "options" | "loading">;

/** Data-bound wrapper around {@link MeetingProviderSelect}: fetches the active
 *  meeting-provider catalog and forwards it as options. Stories target the
 *  presentational component directly, so they stay Apollo-free. */
export function MeetingProviderSelectContainer(props: Readonly<MeetingProviderSelectContainerProps>): React.ReactNode {
  const { data, loading } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: true },
  });
  return <MeetingProviderSelect {...props} options={data?.meetingProviders ?? []} loading={loading} />;
}
