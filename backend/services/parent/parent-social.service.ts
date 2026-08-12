import { ParentRepository } from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { ParentServiceBase } from "@/backend/services/parent/__shared__/parentServiceBase";
import type { ParentProfileResult } from "@/backend/types/parents/parent.types";

export namespace ParentSocialService {
  export async function getSocialProfile(
    userId: string,
    locale?: string
  ): Promise<Pick<ParentProfileResult, "phone" | "facebook" | "whatsapp" | "twitter"> | null> {
    await ParentServiceBase.assertPermission(userId, AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OWN, locale);
    const parent = await ParentServiceBase.resolveParentForUser(userId, locale);
    const profile = await ParentRepository.getParentProfile(parent.id);
    if (!profile) {
      return null;
    }

    return {
      phone: profile.phone,
      facebook: profile.facebook,
      whatsapp: profile.whatsapp,
      twitter: profile.twitter,
    };
  }

  export async function getAdminSocialProfile(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<Pick<ParentProfileResult, "phone" | "facebook" | "whatsapp" | "twitter"> | null> {
    await ParentServiceBase.assertPermission(actorUserId, AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OTHER, locale);
    const profile = await ParentRepository.getParentProfile(parentId);
    if (!profile) {
      return null;
    }

    return {
      phone: profile.phone,
      facebook: profile.facebook,
      whatsapp: profile.whatsapp,
      twitter: profile.twitter,
    };
  }
}
