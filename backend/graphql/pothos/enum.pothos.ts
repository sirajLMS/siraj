import { AppLanguage, CountryCode, Gender, OrderSortDirection, StudentStatus } from "@/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export const OrderSortDirectionPothosObject = gqlSchemaBuilder.enumType(OrderSortDirection, {
  name: "OrderSortDirection",
});

export const GenderPothosObject = gqlSchemaBuilder.enumType(Gender, {
  name: "Gender",
});

export const CountryCodePothosObject = gqlSchemaBuilder.enumType(CountryCode, {
  name: "CountryCode",
});

export const AppLanguagePothosObject = gqlSchemaBuilder.enumType(AppLanguage, {
  name: "AppLanguage",
});

export const StudentStatusPothosObject = gqlSchemaBuilder.enumType(StudentStatus, {
  name: "StudentStatus",
});
