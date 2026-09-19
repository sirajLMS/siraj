import { GraphQLError, Kind, type SelectionNode, type ValidationRule } from "graphql";

/**
 * Static query-complexity ceiling. Counts the selection nodes the request
 * would actually evaluate: fields and inline fragments in the operations,
 * plus each fragment spread expanded to the fragment's internal node count
 * (computed once per fragment, memoized, cycle-guarded).
 *
 * Expanding spreads is what blocks amplification: counting a spread as one
 * node let a wide fragment spread at many aliases execute hundreds of
 * thousands of field selections under a small counted budget.
 */
export function nodeCountLimit(max: number): ValidationRule {
  return context => {
    let nodeCount = 0;
    let insideFragmentDefinition = 0;
    const fragmentNodeCounts = new Map<string, number>();

    const selectionSetCount = (selectionSet: { readonly selections: readonly SelectionNode[] }): number => {
      let count = 0;
      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FRAGMENT_SPREAD) {
          count += 1 + fragmentSelectionCount(selection.name.value);
          continue;
        }
        count += 1;
        if (selection.selectionSet) {
          count += selectionSetCount(selection.selectionSet);
        }
      }
      return count;
    };

    const fragmentSelectionCount = (fragmentName: string): number => {
      const cached = fragmentNodeCounts.get(fragmentName);
      if (cached != null) return cached;
      // In-progress marker: a cyclic spread contributes 0 (NoFragmentCycles also rejects cycles).
      fragmentNodeCounts.set(fragmentName, 0);
      const fragment = context.getFragment(fragmentName);
      const count = fragment ? selectionSetCount(fragment.selectionSet) : 0;
      fragmentNodeCounts.set(fragmentName, count);
      return count;
    };

    return {
      FragmentDefinition: {
        enter() {
          insideFragmentDefinition += 1;
        },
        leave() {
          insideFragmentDefinition -= 1;
        },
      },
      Field() {
        if (insideFragmentDefinition === 0) nodeCount += 1;
      },
      InlineFragment() {
        if (insideFragmentDefinition === 0) nodeCount += 1;
      },
      FragmentSpread(spread) {
        if (insideFragmentDefinition === 0) nodeCount += 1 + fragmentSelectionCount(spread.name.value);
      },
      Document: {
        leave() {
          if (nodeCount > max) {
            context.reportError(
              new GraphQLError(`Query is too complex: ${nodeCount} selection nodes exceed the maximum of ${max}`, {
                extensions: { code: "QUERY_TOO_COMPLEX" },
              })
            );
          }
        },
      },
    };
  };
}
