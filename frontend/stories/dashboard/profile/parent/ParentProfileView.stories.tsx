// NON-BLOCKING baseline note: pre-existing Storybook import mismatches predate Plan v5.
// This story renders the tier switch directly via `ResponsiveViewSwitch` +
// `createLazyView` (the same primitives `ParentProfileView.tsx` delegates to
// on the fabricated-ViewModel path) instead of importing the deprecated
// `ParentProfileView` alias. The previous common ParentProfileView component
// has been split into tier views under
// `frontend/{mobile,desktop}/views/dashboard/profile/parent/parentProfile.{mobile,desktop}.tsx`.
// The fixture also no longer matches the current `ParentProfileViewModel`
// shape post NS-1 + NS-2 lifts (Part B lifted `BaseAdminNoteCardProps` and
// the associated-students card-list/data-grid Props; some fixture fields
// reference the old shape). A full Storybook refresh (re-pointing at
// `ParentProfileContainer` and updating fixtures) is tracked outside Plan v5.
"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  AccountStatus,
  CurrencyCode,
  IanaTimezone,
  ParentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;
type ParentOwnData = NonNullable<ProfileData["parentOwnProfile"]>;
type ParentAdminData = NonNullable<ProfileData["parentAdminProfile"]>;
type AssociatedStudents = ProfileData["associatedStudents"];

const parentOwnProfile: ParentOwnData = {
  id: "parent-own-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  phone: "+966 50 123 4567",
  nationality: "Saudi Arabian",
  address: "Riyadh, Saudi Arabia",
  facebook: "facebook.com/noor.abdullah",
  whatsapp: "+966501234567",
  twitter: "@noor_abdullah",
};

const parentAdminProfile: ParentAdminData = {
  id: "parent-admin-1",
  userId: "user-parent-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  avatarUrl: null,
  lifecycleStatus: ParentStatus.Regular,
  accountStatus: AccountStatus.Activated,
  phone: "+966 50 123 4567",
  nationality: "SA",
  address: "123 King Fahd Rd, Riyadh",
  facebook: "facebook.com/noor.abdullah",
  whatsapp: "+966501234567",
  twitter: "@noor_abdullah",
  invoiceType: "Monthly",
  feeAmount: "500",
  currency: CurrencyCode.Sar,
  displayAmount: null,
  timezone: IanaTimezone.AsiaRiyadh,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
};

const associatedStudents: NonNullable<AssociatedStudents> = {
  id: "associated-students-1",
  totalCount: 2,
  rows: [
    {
      id: "student-1",
      name: "Adam Noor",
      studentAvatarUrl: null,
      status: "REGULAR",
      primaryTeacherId: "teacher-1",
      teacherUserId: "user-teacher-1",
      teacherName: "Ahmed Hassan",
      teacherAvatarUrl: null,
      hoursPerWeek: "3",
      classesRemaining: 14,
      classesTotal: 20,
    },
    {
      id: "student-2",
      name: "Layla Noor",
      studentAvatarUrl: null,
      status: "ON_TRIAL",
      primaryTeacherId: "teacher-2",
      teacherUserId: "user-teacher-2",
      teacherName: "Fatima Ali",
      teacherAvatarUrl: null,
      hoursPerWeek: "2",
      classesRemaining: 6,
      classesTotal: 10,
    },
  ],
};

// Mirrors the lazy view setup in ParentProfileView.tsx so stories render the
// tier switch directly (the non-Container path) rather than via the
// deprecated `ParentProfileView` alias.
const lazyViews = createLazyView<ParentProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/parent/parentProfile.mobile").then(m => ({
      default: m.ParentProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/parent/parentProfile.desktop").then(m => ({
      default: m.ParentProfileDesktopView,
    }))
);

function ParentProfileStory(props: Readonly<ParentProfileViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

const meta: Meta<typeof ParentProfileStory> = {
  title: "Views/profile/parent",
  component: ParentProfileStory,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 1100, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ParentProfileStory>;

export const Default: Story = {
  args: {
    parentData: parentOwnProfile,
    associatedStudents,
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: false,
  },
};

export const AdminView: Story = {
  args: {
    parentData: parentAdminProfile,
    associatedStudents,
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: true,
  },
};

const parentWithStaleDisplayAmount: ParentAdminData = {
  ...parentAdminProfile,
  feeAmount: "500",
  currency: CurrencyCode.Sar,
  displayAmount: {
    id: "displayAmount:parent-admin-1:USD",
    amount: null,
    currency: CurrencyCode.Usd,
    stale: true,
  },
};

export const AdminViewWithStaleDisplayAmount: Story = {
  decorators: [
    Story => {
      useUserStore.setState({ displayCurrency: CurrencyCode.Usd });
      return <Story />;
    },
  ],
  args: {
    parentData: parentWithStaleDisplayAmount,
    associatedStudents,
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: true,
  },
};

export const SocialLinks: Story = {
  args: {
    parentData: {
      ...parentOwnProfile,
      facebook: "https://facebook.com/noor.abdullah",
      whatsapp: "+966501234567",
      twitter: "@noor_abdullah",
    },
    associatedStudents: { id: "associated-students-empty", totalCount: 0, rows: [] },
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: false,
  },
};

export const EmptyStudents: Story = {
  args: {
    parentData: parentOwnProfile,
    associatedStudents: { id: "associated-students-empty", totalCount: 0, rows: [] },
    isAdminScope: false,
  },
};
