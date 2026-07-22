/* eslint-disable react-refresh/only-export-components */
import type { GridColDef } from "@mui/x-data-grid";

// cspell:ignore Lannister, Cersei, Targaryen, Daenerys

/**
 * Shared Storybook fixtures for DataGrid stories — the duplicate `columns`
 * and `rows` arrays from the GoT cast list duplicated in three AppDataGrid
 * stories (Sonar cluster 1, group 1). Import these instead of repeating the
 * literal arrays in each Storybook file.
 */
export const SAMPLE_GRID_COLUMNS: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "firstName", headerName: "First name", width: 150 },
  { field: "lastName", headerName: "Last name", width: 150 },
  { field: "age", headerName: "Age", type: "number", width: 110 },
];

export interface SampleGridRow {
  readonly id: number;
  readonly lastName: string;
  readonly firstName: string;
  readonly age: number | null;
}

export const SAMPLE_GRID_ROWS: readonly SampleGridRow[] = [
  { id: 1, lastName: "Snow", firstName: "Jon", age: 35 },
  { id: 2, lastName: "Lannister", firstName: "Cersei", age: 42 },
  { id: 3, lastName: "Lannister", firstName: "Jaime", age: 45 },
  { id: 4, lastName: "Stark", firstName: "Arya", age: 16 },
  { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
];

/**
 * The decorator that wraps a DataGrid story in the standard 400 px
 * height container — used by all three AppDataGrid stories.
 */
interface DataGridHeightDecoratorProps {
  readonly Story: () => React.ReactNode;
}

export function DataGridHeightDecorator({ Story }: DataGridHeightDecoratorProps) {
  return (
    <div style={{ height: 400, width: "100%" }}>
      <Story />
    </div>
  );
}

export const dataGridHeightDecorator = (Story: () => React.ReactNode) => <DataGridHeightDecorator Story={Story} />;
