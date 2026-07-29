import type { ProfileFieldAccessLabels, ProfileLabels } from "@/shared/locale/types/profile";

export type ProfileSharedBaseLabels = Pick<ProfileLabels, "notSet"> & {
  readonly fieldAccess: ProfileFieldAccessLabels;
};

export type ProfilePersonalFieldLabels = {
  readonly nationality: string;
  readonly address: string;
  readonly dateOfBirth: string;
  readonly gender: string;
  readonly male: string;
  readonly female: string;
  readonly qualifications: string;
};

export type ProfilePersonalFieldVisibility = {
  readonly nationality?: boolean;
  readonly address?: boolean;
  readonly dateOfBirth?: boolean;
  readonly gender?: boolean;
  readonly qualifications?: boolean;
};
