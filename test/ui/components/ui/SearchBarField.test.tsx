import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

describe("SearchBarField", () => {
  test("renders input with accessible aria-label matching placeholder", () => {
    renderWithWrapper(
      <SearchBarField
        value=""
        placeholder="Search teachers..."
        onChange={() => {}}
      />,
    );

    const input = screen.getByLabelText("Search teachers...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search teachers...");
  });

  test("does not render clear button when value is empty", () => {
    renderWithWrapper(
      <SearchBarField
        value=""
        placeholder="Search..."
        onChange={() => {}}
      />,
    );

    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  test("renders clear button when value is non-empty and handles click", async () => {
    const handleChange = mock(() => {});
    const user = userEvent.setup();

    renderWithWrapper(
      <SearchBarField
        value="Math"
        placeholder="Search..."
        onChange={handleChange}
        clearLabel="Clear search text"
      />,
    );

    const clearBtn = screen.getByRole("button", { name: "Clear search text" });
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);
    expect(handleChange).toHaveBeenCalledWith("");
  });

  test("renders searching helper text when isSearching is true", () => {
    renderWithWrapper(
      <SearchBarField
        value="Math"
        placeholder="Search..."
        searchingLabel="Searching items..."
        isSearching={true}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Searching items...")).toBeInTheDocument();
  });
});
