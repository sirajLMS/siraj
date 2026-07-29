import { ParentRepository } from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services";
import type { ParentProfileResult } from "@/backend/types/parents/parent.types";
import { getServerTranslations } from "@/shared/locale";

export namespace ParentSocialService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
    }
  }

  async function resolveParentForUser(userId: string, locale?: string) {
    const parent = await ParentRepository.findByUserId(userId);
    if (!parent) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.notFound);
    }
    return parent;
  }

  export async function getSocialProfile(
    userId: string,
    locale?: string
  ): Promise<Pick<ParentProfileResult, "phone" | "facebook" | "whatsapp" | "twitter"> | null> {
    await assertPermission(userId, AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OWN, locale);
    const parent = await resolveParentForUser(userId, locale);
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
    await assertPermission(actorUserId, AppPermission.PROFILE_PARENT_SOCIAL_VIEW_OTHER, locale);
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
