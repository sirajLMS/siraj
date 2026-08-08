import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { orchestrateSeedMany } from "@/backend/db/seeds/lib/orchestrate-seed-many";
import { logger } from "@/backend/lib/logger";
import { TeacherNotesService } from "@/backend/services/subject/teacher-notes.service";
import type { TeacherSelectType, UserSelectType } from "@/backend/types";

type TeacherNoteSeedSpec = {
  title: string;
  body: string;
  teacherId: string;
  createdByUserId: string;
  isPublished: boolean;
  priority: number;
};

const NOTE_SPECS: readonly Pick<TeacherNoteSeedSpec, "title" | "body">[] = [
  { title: "Welcome to Siraj", body: "Please review the teacher handbook before your first class." },
  { title: "Ramadan Schedule", body: "Class times shift during Ramadan — check your dashboard for updates." },
];

export async function seedOrGet(teachersList: TeacherSelectType[], usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding teacher important notes...");
  const seedConfig = config ?? loadSeedConfig();

  const adminUser = usersList.find(user => user.email === "academy@siraj.local") ?? usersList[0];
  const teacher = teachersList[0];
  if (!adminUser || !teacher) {
    logger.warn("Missing admin or teacher — skipping teacher important notes.");
    return [];
  }

  const selectedNotes = seedConfig.profile === "standard" ? NOTE_SPECS : NOTE_SPECS.slice(0, 1);
  const specs: TeacherNoteSeedSpec[] = selectedNotes.map(note =>
    Object.assign(note, {
      teacherId: teacher.id,
      createdByUserId: adminUser.id,
      isPublished: true,
      priority: 1,
    })
  );

  const results = await orchestrateSeedMany({
    specs,
    toKey: spec => spec.title,
    findExisting: async titles => {
      const rows = await TeacherNotesService.findNotesByTitles(titles);
      return new Map(rows.map(row => [row.title, row] as const));
    },
    createMany: TeacherNotesService.createManyImportantNotes,
    refetchOnRace: async titles => {
      const rows = await TeacherNotesService.findNotesByTitles(titles);
      return new Map(rows.map(row => [row.title, row] as const));
    },
  });

  logger.info(`Teacher important notes seeded (${results.length} rows).`);
  return results;
}
