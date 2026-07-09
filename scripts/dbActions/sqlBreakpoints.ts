/**
 * Insert drizzle statement breakpoints so multi-statement custom SQL migrates correctly.
 * Skips semicolons inside PostgreSQL dollar-quoted bodies.
 */
export function withStatementBreakpoints(sql: string): string {
  // Rebuild breakpoints from scratch so comment semicolons are never treated as statement ends.
  const source = sql.replaceAll("--> statement-breakpoint\n", "").replaceAll("--> statement-breakpoint", "");

  let result = "";
  let i = 0;
  type State = "code" | "line_comment" | "block_comment" | "dollar" | "single" | "double";
  let state: State = "code";
  let dollarTag = "";

  while (i < source.length) {
    const ch = source[i];
    const nxt = i + 1 < source.length ? source[i + 1] : "";

    if (state === "code") {
      if (ch === "-" && nxt === "-") {
        state = "line_comment";
        result += ch;
        i += 1;
        continue;
      }
      if (ch === "/" && nxt === "*") {
        state = "block_comment";
        result += ch;
        i += 1;
        continue;
      }
      if (ch === "'") {
        state = "single";
        result += ch;
        i += 1;
        continue;
      }
      if (ch === '"') {
        state = "double";
        result += ch;
        i += 1;
        continue;
      }
      const dollarMatch = /^\$([A-Za-z_]*)\$/.exec(source.slice(i));
      if (dollarMatch) {
        state = "dollar";
        dollarTag = dollarMatch[0];
        result += dollarTag;
        i += dollarTag.length;
        continue;
      }
      result += ch;
      if (ch === ";") {
        result += "\n--> statement-breakpoint";
      }
      i += 1;
      continue;
    }

    if (state === "line_comment") {
      result += ch;
      if (ch === "\n") {
        state = "code";
      }
      i += 1;
      continue;
    }

    if (state === "block_comment") {
      result += ch;
      if (ch === "*" && nxt === "/") {
        result += nxt;
        i += 2;
        state = "code";
        continue;
      }
      i += 1;
      continue;
    }

    if (state === "single") {
      result += ch;
      if (ch === "'" && nxt === "'") {
        result += nxt;
        i += 2;
        continue;
      }
      if (ch === "'") {
        state = "code";
      }
      i += 1;
      continue;
    }

    if (state === "double") {
      result += ch;
      if (ch === '"' && nxt === '"') {
        result += nxt;
        i += 2;
        continue;
      }
      if (ch === '"') {
        state = "code";
      }
      i += 1;
      continue;
    }

    // dollar
    const end = source.indexOf(dollarTag, i);
    if (end === -1) {
      result += source.slice(i);
      break;
    }
    result += source.slice(i, end + dollarTag.length);
    i = end + dollarTag.length;
    state = "code";
    dollarTag = "";
  }

  return result.replace(/(--> statement-breakpoint\n?)+/g, "--> statement-breakpoint\n");
}
