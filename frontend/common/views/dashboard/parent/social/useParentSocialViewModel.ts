"use client";

import type { ParentSocialLabels } from "@/shared/locale";

interface ParentSocialProfileShape {
  readonly phone?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
}

export interface ParentSocialViewModel {
  readonly labels: ParentSocialLabels;
  readonly loading: boolean;
  readonly error: boolean;
  readonly profile: ParentSocialProfileShape | null;
}

export type UseParentSocialViewModelProps = ParentSocialViewModel;

export function useParentSocialViewModel(props: Readonly<UseParentSocialViewModelProps>): ParentSocialViewModel {
  const { labels, loading, error, profile } = props;
  return { labels, loading, error, profile };
}
