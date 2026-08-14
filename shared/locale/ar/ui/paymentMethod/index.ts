export * from "./defaultsEditor";
export * from "./direction";
export * from "./display";
export * from "./identifier";
export * from "./list";
export * from "./manager";
export * from "./select";
export * from "./type";
export * from "./typeFields";
export * from "./typeSelector";

import { uiPaymentMethodDefaultsEditorAr as defaultsEditor } from "./defaultsEditor";
import { uiPaymentMethodDirectionAr as direction } from "./direction";
import { uiPaymentMethodDisplayAr as display } from "./display";
import { uiPaymentMethodIdentifierAr as identifier } from "./identifier";
import { uiPaymentMethodListAr as list } from "./list";
import { uiPaymentMethodManagerAr as manager } from "./manager";
import { uiPaymentMethodSelectAr as select } from "./select";
import { uiPaymentMethodTypeAr as type } from "./type";
import { uiPaymentMethodTypeFieldsAr as typeFields } from "./typeFields";
import { uiPaymentMethodTypeSelectorAr as typeSelector } from "./typeSelector";

export const uiPaymentMethodAr = {
  type,
  direction,
  identifier,
  typeSelector,
  select,
  display,
  list,
  manager,
  defaultsEditor,
  typeFields,
};
