import { describe, expect, test } from "bun:test";
import { buildSchema, type GraphQLError, parse, validate } from "graphql";

import { nodeCountLimit } from "@/backend/graphql/shared";

const schema = buildSchema(/* GraphQL */ `
  type Item {
    id: ID!
    name: String
  }
  type Query {
    a: Item
    b: Item
    items: [Item!]!
  }
`);

const LIMIT = 10;

function validateWithRule(query: string): readonly GraphQLError[] {
  return validate(schema, parse(query), [nodeCountLimit(LIMIT)]);
}

function expectRejection(query: string): string {
  const errors = validateWithRule(query);
  expect(errors.length).toBeGreaterThan(0);
  return errors[0]?.message ?? "";
}

describe("nodeCountLimit validation rule", () => {
  test("query under the limit passes", () => {
    expect(
      validateWithRule(/* GraphQL */ `
        query {
          a {
            id
            name
          }
          b {
            id
          }
        }
      `)
    ).toEqual([]);
  });

  test("query over the limit is rejected with the expected error", () => {
    const fields = Array.from({ length: LIMIT + 1 }, (_, i) => `f${i}: a { id }`).join("\n");
    const message = expectRejection(/* GraphQL */ `
      query {
        ${fields}
      }
    `);
    expect(message).toContain("too complex");
    expect(message).toContain(`maximum of ${LIMIT}`);
  });

  test("aliased fields are counted individually (alias amplification blocked)", () => {
    expect(validateWithRule("query { a { id } }")).toEqual([]);
    // LIMIT+1 aliased copies of the same field exceed the budget.
    const fields = Array.from({ length: LIMIT + 1 }, (_, i) => `alias${i}: a { id }`).join(" ");
    expectRejection(`query { ${fields} }`);
  });

  test("fragment spreads expand to the fragment's internal node count", () => {
    // 1 field + 1 inline fragment + 1 field inside it
    // + 11 spreads × (1 spread site + 2 fields in the fragment) = 36.
    const spread = Array.from({ length: LIMIT + 1 }, () => `...ItemFields`).join(" ");
    const message = expectRejection(/* GraphQL */ `
      query {
        items {
          ... on Item {
            id
          }
          ${spread}
        }
      }
      fragment ItemFields on Item {
        id
        name
      }
    `);
    expect(message).toContain(`${LIMIT + 26}`);
  });

  test("a wide fragment spread is counted per expansion (amplification blocked)", () => {
    // 3 root fields + 3 spreads × (1 + 2 fragment fields) = 12 > LIMIT.
    const message = expectRejection(/* GraphQL */ `
      query {
        a {
          ...ItemFields
        }
        b {
          ...ItemFields
        }
        items {
          ...ItemFields
        }
      }
      fragment ItemFields on Item {
        id
        name
      }
    `);
    expect(message).toContain("12");
  });

  test("a fragment spread within budget passes", () => {
    // 1 root field + 1 spread × (1 + 2 fragment fields) = 4, under LIMIT.
    expect(
      validateWithRule(/* GraphQL */ `
        query {
          a {
            ...ItemFields
          }
        }
        fragment ItemFields on Item {
          id
          name
        }
      `)
    ).toEqual([]);
  });
});
