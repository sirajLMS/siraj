import { GraphQLScalarType, Kind } from "graphql";
import { PhoneNumber } from "@/shared/lib/phone";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// Pothos custom scalar for PhoneNumber
export const PhoneNumberScalar = new GraphQLScalarType({
  name: "PhoneNumber",
  description: "A type representing a validated phone number",
  serialize(value: unknown): string {
    if (value instanceof PhoneNumber) {
      return value.number;
    }
    throw new TypeError(`Cannot serialize value as PhoneNumber: ${String(value)}`);
  },
  parseValue(value: unknown): PhoneNumber {
    if (typeof value === "string") {
      try {
        const phone = new PhoneNumber(value);
        // Validate using google lib phone number
        if (PhoneNumber.util.isValidNumber(phone.googlePhoneNumber)) {
          return phone;
        }
        throw new TypeError("Invalid phone number");
      } catch (err) {
        throw new TypeError(`Invalid phone number: ${value}: ${getErrorMessage(err)}`, { cause: err });
      }
    }
    throw new TypeError(`Expected string for PhoneNumber, got: ${typeof value}`);
  },
  parseLiteral(ast): PhoneNumber {
    if (ast.kind === Kind.STRING) {
      try {
        const phone = new PhoneNumber(ast.value);
        if (PhoneNumber.util.isValidNumber(phone.googlePhoneNumber)) {
          return phone;
        }
        throw new TypeError("Invalid phone number");
      } catch (err) {
        throw new TypeError(`Invalid phone number literal: ${ast.value}: ${getErrorMessage(err)}`, { cause: err });
      }
    }
    throw new TypeError("PhoneNumber literal must be a string");
  },
});
