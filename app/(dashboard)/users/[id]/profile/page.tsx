import {
  makeUserProfilePageComponent,
  makeUserProfilePageMetadata,
} from "@/app/(dashboard)/users/[id]/profile/__shared__/makeUserProfilePage";
import { ProfileMode } from "@/backend/enum";

export const generateMetadata = makeUserProfilePageMetadata("pageTitle");

export default makeUserProfilePageComponent(ProfileMode.VIEW);
