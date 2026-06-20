declare module "bun:test" {
  interface Matchers<T = unknown> {
    toBeInTheDocument(): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeEmpty(): T;
    toBeEmptyDOMElement(): T;
    toBeInvalid(): T;
    toBeRequired(): T;
    toBeValid(): T;
    toContainElement(element: HTMLElement | SVGElement | null): T;
    toContainHTML(htmlText: string): T;
    toHaveAccessibleDescription(expectedDescription?: string | RegExp): T;
    toHaveAccessibleErrorMessage(expectedMessage?: string | RegExp): T;
    toHaveAccessibleName(expectedName?: string | RegExp): T;
    toHaveAttribute(attr: string, value?: string | RegExp): T;
    toHaveClass(...classNames: string[]): T;
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): T;
    toHaveFocus(): T;
    toHaveFormValues(expectedValues: Record<string, unknown>): T;
    toHaveStyle(css: string | Record<string, unknown>): T;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): T;
    toHaveValue(value?: string | string[] | number | null): T;
    toHaveRole(role: string): T;
    toBePartiallyChecked(): T;
    toHaveErrorMessage(expectedMessage?: string | RegExp): T;
  }
}
