import { StudentRepository } from "@/backend/db/repo/student.repository";
import { StudentUtils } from "@/backend/utils";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  PartialStudentUpdateInputPothosObject,
  // StudentCreateInputPothosObject,
  StudentPothosObject,
} from "../pothos";

gqlSchemaBuilder.mutationFields(t => ({
  // createStudent: t.field({
  //   type: StudentPothosObject,
  //   nullable: true,
  //   args: {
  //     input: t.arg({
  //       type: StudentCreateInputPothosObject,
  //       required: true,
  //     }),
  //   },
  //   resolve: async (_query, args) => {
  //     const input = args.input;
  //     const student = await StudentRepository.create(input);
  //     return StudentUtils.mapEntityToDto(student);
  //   },
  // }),

  partiallyUpdateStudent: t.field({
    type: StudentPothosObject,
    args: {
      input: t.arg({
        type: PartialStudentUpdateInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_query, args) =>
      await StudentRepository.partiallyUpdate(args.input).then(s => StudentUtils.mapEntityToDto(s)),
  }),

  deleteStudent: t.field({
    type: StudentPothosObject,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, args) =>
      await StudentRepository.deleteById(args.id).then(s => StudentUtils.mapEntityToDto(s)),
  }),
}));
