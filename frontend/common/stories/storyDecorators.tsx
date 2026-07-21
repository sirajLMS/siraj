import { Box } from "@mui/material";

// cspell:ignore Lannister, Cersei, Targaryen, Daenerys

/**
 * Generic decorator that wraps a story in a fixed-height container. Used by
 * stories that need an explicit `height` slot (DataGrid, lists, etc).
 *
 * Implements the Storybook decorator contract `(Story) => ReactNode` but
 * factors the JSX into a named component (with displayName) to satisfy the
 * `react/display-name` ESLint rule that applies to non-story files.
 */
export function heightDecorator(height: number | string, width: string | number = "100%") {
  return function HeightDecorator({ Story }: { Story: () => React.ReactNode }) {
    return (
      <Box sx={{ height, width }}>
        <Story />
      </Box>
    );
  };
}
