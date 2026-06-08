import { StudentRepository } from "@/backend/db/repo";
import * as Pothos from "@/backend/graphql/pothos";
import * as Types from "@/backend/types";
import { StudentUtils } from "@/backend/utils";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

gqlSchemaBuilder.queryFields((t) => ({
	student: t.field({
		type: Pothos.StudentPothosObject,
		nullable: true,
		args: {
			id: t.arg.int({ required: true }),
		},
		resolve: async (_query, args) =>
			await StudentRepository.findById(args.id).then((s) =>
				StudentUtils.mapEntityToDto(s),
			),
	}),

	students: t.field({
		type: Pothos.StudentsWithFiltersPothosObject,
		nullable: false,
		args: {
			paginationArgs: t.arg({
				type: Pothos.PaginationArgsObject,
				required: false,
			}),
			orderBy: t.arg({
				type: [Pothos.StudentsOrderByClausePothosObject],
				required: false,
			}),
			filterArgs: t.arg({
				type: Pothos.StudentFilterArgsPothosObject,
				required: false,
			}),
		},
		resolve: async (_, args) =>
			await StudentRepository.fetchWithFilters(
				new Types.PaginationArgs({ ...args.paginationArgs }),
				args.filterArgs as unknown as Types.StudentFilterArgs,
			),
	}),
}));
