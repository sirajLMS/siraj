/** Canonical on-disk avatar filenames under `assets/avatars/{persona}/`. */

export const TEACHER_AVATAR_FILES = [
  "male_1.png",
  "female_1.png",
  "male_2.png",
  "female_2.png",
  "male_3.png",
  "female_3.png",
  "male_4.png",
] as const;

export const PARENT_AVATAR_FILES = ["male_1.png", "female_1.png", "male_2.png", "female_2.png"] as const;

export const STUDENT_AVATAR_FILES = [
  "male_1.png",
  "male_2.png",
  "male_3.png",
  "male_4.png",
  "female_1.png",
  "female_2.png",
  "female_3.png",
  "female_4.png",
] as const;

export type AvatarPersona = "teachers" | "parents" | "students";

export function getAvatarPoolFiles(persona: AvatarPersona): readonly string[] {
  switch (persona) {
    case "teachers":
      return TEACHER_AVATAR_FILES;
    case "parents":
      return PARENT_AVATAR_FILES;
    case "students":
      return STUDENT_AVATAR_FILES;
  }
  throw new Error(`Unhandled case in getAvatarPoolFiles`);
}

export function getAvatarFileNameForPersona(persona: AvatarPersona, index: number): string {
  const pool = getAvatarPoolFiles(persona);
  return pool[index % pool.length] ?? pool[0];
}
