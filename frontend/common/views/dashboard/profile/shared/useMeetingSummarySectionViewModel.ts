"use client";

import { useQuery } from "@apollo/client/react";
import { userMeetingConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { useMeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels";

export type UseMeetingSummarySectionViewModelProps = {
  readonly userId: string;
};

export function useMeetingSummarySectionViewModel(props: Readonly<UseMeetingSummarySectionViewModelProps>) {
  const { userId } = props;
  const labels = useMeetingConfigProfileLabels();

  const { data, loading } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId },
  });

  const configs = data?.userMeetingConfigs ?? [];
  const defaultConfig = configs.find(config => config.isDefault) ?? (configs.length === 1 ? configs[0] : null);

  return {
    labels,
    loading,
    defaultConfig,
  };
}

export type MeetingSummarySectionViewModel = ReturnType<typeof useMeetingSummarySectionViewModel>;
