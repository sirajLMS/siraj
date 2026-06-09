import { GraphQLScalarType, Kind } from "graphql";
import { Email } from "@/backend/lib";

// Pothos custom scalar for Email
export const EmailScalar = new GraphQLScalarType({
  name: "Email",
  description: "A type representing a validated email address",
  serialize(value: unknown): string | null | undefined {
    if (value instanceof Email) {
      return value.value;
    }
    throw new TypeError(`Cannot serialize value as Email: ${value}`);
  },
  parseValue(value: unknown): Email {
    if (typeof value === "string") {
      try {
        return new Email(value);
      } catch (err) {
        throw new TypeError(`Invalid email address: ${value}: ${(err as Error).message}`, { cause: err });
      }
    }
    throw new TypeError(`Expected string for Email, got: ${typeof value}`);
  },
  parseLiteral(ast): Email {
    if (ast.kind === Kind.STRING) {
      try {
        return new Email(ast.value);
      } catch (err) {
        throw new TypeError(`Invalid email address literal: ${ast.value}: ${(err as Error).message}`, { cause: err });
      }
    }
    throw new TypeError("Email literal must be a string");
  },
});
