import type { Control, UseFormRegister } from "react-hook-form";
import type { CurrencyCode, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  ParentAdminData,
  ParentSectionLabelsBundle,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";

type ParentAccountFormFields = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  displayCurrency?: CurrencyCode | null;
  lifecycleStatus?: ParentStatus;
};

type AccountParentData = Pick<ParentViewData, "name" | "email"> & { accountStatus?: string | null };

export type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly labels: ParentSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
      readonly displayCurrency: CurrencyCode | null | undefined;
      readonly adminData?: ParentAdminData | null;
    }
  | {
      readonly mode: "edit";
      readonly labels: ParentSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly parentData: AccountParentData;
      readonly register: UseFormRegister<ParentAccountFormFields>;
      readonly control: Control<ParentAccountFormFields>;
    };
