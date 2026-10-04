"use client";

import { SubjectDialogsShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogsShared";
import type { SubjectsViewProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { CreateCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/createCategoryDialog.mobile";
import { CreateSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/createSubjectDialog.mobile";
import { DeleteCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/deleteCategoryDialog.mobile";
import { DeleteSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/deleteSubjectDialog.mobile";
import { EditCategoryDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/editCategoryDialog.mobile";
import { EditSubjectDialogMobile } from "@/frontend/mobile/views/dashboard/subjects/home/components/editSubjectDialog.mobile";

type SubjectDialogsProps = Pick<
  SubjectsViewProps,
  | "createSubjectDialog"
  | "editSubjectDialog"
  | "deleteSubjectDialog"
  | "createCategoryDialog"
  | "editCategoryDialog"
  | "deleteCategoryDialog"
>;

function SubjectDialogsSection(props: Readonly<SubjectDialogsProps>) {
  return (
    <SubjectDialogsShared
      {...props}
      CreateSubjectDialog={CreateSubjectDialogMobile}
      EditSubjectDialog={EditSubjectDialogMobile}
      DeleteSubjectDialog={DeleteSubjectDialogMobile}
      CreateCategoryDialog={CreateCategoryDialogMobile}
      EditCategoryDialog={EditCategoryDialogMobile}
      DeleteCategoryDialog={DeleteCategoryDialogMobile}
    />
  );
}

export { SubjectDialogsSection };
