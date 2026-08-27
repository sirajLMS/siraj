/**
 * Style-inspection helpers for Happy DOM component tests.
 *
 * jest-dom style matchers rely on computed styles, which Happy DOM does not
 * resolve for Emotion-generated class rules. Emotion also runs in speedy mode
 * under the test env, so rules live in `style.sheet.cssRules` (textContent is
 * empty) and generated classes use the cache key prefix (e.g. `test-rtl-xxxx`)
 * instead of the default `css-` prefix.
 */

const GENERATED_CLASS_PATTERN = /^(?:css-|test-ltr-|test-rtl-)/;
const CLASS_NAME_CHAR = /[\w-]/;

function collectInjectedCss(): readonly string[] {
  const blocks: string[] = [];
  for (const style of Array.from(document.querySelectorAll("style"))) {
    const text = style.textContent ?? "";
    if (text.length > 0) {
      blocks.push(text);
    }
    const sheet = style.sheet;
    if (!sheet) {
      continue;
    }
    for (const rule of Array.from(sheet.cssRules)) {
      blocks.push(rule.cssText);
    }
  }
  return blocks;
}

function ruleTargetsClass(ruleText: string, className: string): boolean {
  const selector = `.${className}`;
  let fromIndex = 0;
  for (;;) {
    const index = ruleText.indexOf(selector, fromIndex);
    if (index === -1) {
      return false;
    }
    const nextChar = ruleText.charAt(index + selector.length);
    if (!CLASS_NAME_CHAR.test(nextChar)) {
      return true;
    }
    fromIndex = index + selector.length;
  }
}

/**
 * Returns every injected CSS rule block (including nested responsive blocks)
 * that targets the element's generated classes. An empty string means no
 * generated styles were found for the element.
 */
export function getEmotionStylesForElement(element: Element): string {
  const generatedClasses = element.className.split(/\s+/).filter(cls => GENERATED_CLASS_PATTERN.test(cls));
  const matches: string[] = [];
  for (const ruleText of collectInjectedCss()) {
    if (generatedClasses.some(cls => ruleTargetsClass(ruleText, cls))) {
      matches.push(ruleText);
    }
  }
  return matches.join("\n");
}

/**
 * Returns the padding declarations found in the element's generated Emotion
 * rules. An empty array means the element has no generated padding — used to
 * assert layout-ownership rules (views must not add their own padding).
 */
export function getPaddingDeclarations(element: Element): readonly string[] {
  const css = getEmotionStylesForElement(element);
  const declarations = css.match(/padding[a-z-]*\s*:[^;]+/gi);
  return declarations ?? [];
}
