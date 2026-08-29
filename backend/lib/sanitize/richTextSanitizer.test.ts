import { describe, expect, test } from "bun:test";

import { sanitizePlainText, sanitizeRichText } from "@/backend/lib/sanitize/richTextSanitizer";

/**
 * Removes every canonical tag the sanitizer is allowed to emit; the
 * remainder of a correctly sanitized string must contain no raw `<`
 * (stray angle brackets are required to be escaped to `&lt;`).
 */
const ALLOWED_TAG_PATTERN = /<(?:\/)?(?:b|br|em|i|li|ol|p|strong|u|ul)>/g;

function expectFullySanitized(output: string): void {
  const withoutAllowedTags = output.replace(ALLOWED_TAG_PATTERN, "");
  expect(withoutAllowedTags.includes("<")).toBe(false);
  expect(sanitizeRichText(output)).toBe(output);
}

/** Deterministic PRNG so fuzz failures are reproducible from the seed. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FUZZ_FRAGMENTS = [
  "<b>",
  "</b>",
  "<script>",
  "</script>",
  "<img src=x onerror=alert(1)>",
  '<a href="javascript:alert(1)">',
  "<svg>",
  "</svg>",
  "<p>",
  "</p>",
  "plain text ",
  "مرحبا ",
  "&lt;",
  "<",
  ">",
  '"',
  "'",
  "onload=",
  "</li>",
  "<ul>",
  "<li>",
  "<style>",
  "</style>",
  "</",
  "alert(1) ",
  "<u>",
  "</u>",
  "<ol>",
  "<em>",
  "</em>",
  "<strong>",
  "</strong>",
  "<br>",
  "<img src=x onerror=alert(1)",
] as const;

describe("sanitizeRichText — Tier 1: branches", () => {
  test("returns empty string for empty input", () => {
    expect(sanitizeRichText("")).toBe("");
  });

  test("passes plain text through unchanged", () => {
    expect(sanitizeRichText("Adjustment for missed class")).toBe("Adjustment for missed class");
  });

  test("preserves b, i, ul and li tags", () => {
    expect(sanitizeRichText("<b>bold</b> <i>italic</i> <ul><li>item</li></ul>")).toBe(
      "<b>bold</b> <i>italic</i> <ul><li>item</li></ul>"
    );
  });

  test("preserves the full editor formatting set", () => {
    const input = "<p>para</p><strong>s</strong><em>e</em><u>u</u><ol><li>n</li></ol><br>";
    expect(sanitizeRichText(input)).toBe("<p>para</p><strong>s</strong><em>e</em><u>u</u><ol><li>n</li></ol><br>");
  });

  test("normalizes non-canonical br forms to <br>", () => {
    expect(sanitizeRichText("a<br/>b</br>c<BR>d")).toBe("a<br>b<br>c<br>d");
  });

  test("removes disallowed tags but keeps their inner text", () => {
    expect(sanitizeRichText("<div><span>reason</span> here</div>")).toBe("reason here");
  });

  test("drops every attribute from allowed tags, including event handlers", () => {
    expect(sanitizeRichText('<b onclick="steal()" style="color:red">x</b>')).toBe("<b>x</b>");
  });

  test("strips dangerous container tags together with their contents", () => {
    expect(sanitizeRichText("<script>alert(1)</script>reason")).toBe("reason");
    expect(sanitizeRichText("<style>body{display:none}</style>reason")).toBe("reason");
    expect(sanitizeRichText('<iframe src="https://evil.example"></iframe>reason')).toBe("reason");
  });

  test("handles closing tags of disallowed elements", () => {
    expect(sanitizeRichText("text</div></section>")).toBe("text");
  });

  test("removes comments and processing-instruction shaped markup", () => {
    expect(sanitizeRichText("a<!-- hidden -->b<?xml version='1.0'?>c")).toBe("abc");
  });
});

describe("sanitizeRichText — Tier 2: boundaries", () => {
  test("single-character plain text passes through", () => {
    expect(sanitizeRichText("x")).toBe("x");
  });

  test("unicode, RTL and Arabic content survive untouched", () => {
    const input = "خصم ساعتين بسبب <b>الغياب</b> المتواصل — ٣ أيام";
    expect(sanitizeRichText(input)).toBe(input);
  });

  test("already-escaped entities are left as inert text", () => {
    const input = "&lt;script&gt;alert(1)&lt;/script&gt;";
    expect(sanitizeRichText(input)).toBe(input);
  });

  test("escapes a stray < that is not part of a tag", () => {
    expect(sanitizeRichText("a < b")).toBe("a &lt; b");
  });

  test("handles very long input without dropping or truncating benign markup", () => {
    const unit = "<p>سطر <b>مهم</b> هنا</p>";
    const input = unit.repeat(20_000);
    const output = sanitizeRichText(input);
    expect(output).toBe(input);
    expect(output).toHaveLength(input.length);
  });

  test("sanitizing twice is a fixed point (idempotent)", () => {
    const dirty = '<p onclick="x()">a</p><script>evil()</script><img src=y onerror=z()><b ok';
    const once = sanitizeRichText(dirty);
    expect(sanitizeRichText(once)).toBe(once);
  });
});

describe("sanitizeRichText — Tier 3: randomized injection fuzzing", () => {
  test("random fragment combinations never produce raw unsafe markup", () => {
    const random = mulberry32(0xc0ffee);
    for (let round = 0; round < 2000; round++) {
      const fragmentCount = 1 + Math.floor(random() * 20);
      let payload = "";
      for (let i = 0; i < fragmentCount; i++) {
        payload += FUZZ_FRAGMENTS[Math.floor(random() * FUZZ_FRAGMENTS.length)];
      }
      expectFullySanitized(sanitizeRichText(payload));
    }
  });

  test("mutations of known XSS cheat-sheet payloads are neutralized", () => {
    const random = mulberry32(0xbadf00d);
    const seeds = [
      "<SCRIPT>alert(1)</SCRIPT>",
      "<IMG SRC=javascript:alert(1)>",
      "<svg onload=alert(1)>",
      '<a href="jAvAsCrIpT:alert(1)">x</a>',
      "<body onload=alert(1)>",
      "<iframe src=javascript:alert(1)></iframe>",
    ] as const;
    for (let round = 0; round < 500; round++) {
      const seed = seeds[Math.floor(random() * seeds.length)];
      const cut = Math.floor(random() * seed.length);
      const mutated = `${seed.slice(0, cut)}<${seed.slice(cut)}${FUZZ_FRAGMENTS[Math.floor(random() * FUZZ_FRAGMENTS.length)]}`;
      expectFullySanitized(sanitizeRichText(mutated));
    }
  });
});

describe("sanitizeRichText — Tier 4: security battery", () => {
  const NEUTRALIZED_CASES: ReadonlyArray<readonly [string, string]> = [
    ["plain script element", "<script>alert(1)</script>"],
    ["uppercase script element", "<SCRIPT>alert(1)</SCRIPT>"],
    ["script with src attribute", '<script src="https://evil.example/x.js"></script>'],
    ["img onerror handler", "<img src=x onerror=alert(1)>"],
    ["img onerror self-closing", "<img src=x onerror=alert(1)/>"],
    ["javascript: href", '<a href="javascript:alert(1)">click</a>'],
    ["data: URL href", '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
    ["entity-obfuscated javascript: href", '<a href="j&#x61;vascript:alert(1)">x</a>'],
    ["svg onload attribute", "<svg onload=alert(1)>"],
    ["svg wrapping script", "<svg><script>alert(1)</script></svg>"],
    ["math wrapping style breakout", "<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>"],
    ["iframe with javascript: src", "<iframe src=javascript:alert(1)></iframe>"],
    ["form with javascript formaction", '<form><button formaction="javascript:alert(1)">x</button></form>'],
    ["object embed", '<object data="data:text/html,<script>alert(1)</script>"></object>'],
    ["embed element", '<embed src="data:text/html,<script>alert(1)</script>">'],
    ["mXSS listing/noscript pattern", "<listing><img src=x onerror=alert(1)></listing>"],
    ["double-nested script tag obfuscation", "<scr<script>ipt>alert(1)</scr</script>ipt>"],
    ["leading stray angle bracket before script", "<<script>alert(1)</script>"],
    ["style-based import", "<style>@import url('https://evil.example/x.css');</style>"],
    ["body event handler", "<body onpageshow=alert(1)>x</body>"],
    ["details ontoggle handler", "<details open ontoggle=alert(1)>x</details>"],
  ];

  for (const [name, payload] of NEUTRALIZED_CASES) {
    test(`neutralizes ${name}`, () => {
      const output = sanitizeRichText(payload);
      expect(output.toLowerCase()).not.toContain("<script");
      expect(output.toLowerCase()).not.toContain("<img");
      expect(output.toLowerCase()).not.toContain("<svg");
      expect(output.toLowerCase()).not.toContain("<iframe");
      expect(output).not.toMatch(/on\w+\s*=/i);
      expect(output.toLowerCase()).not.toContain("javascript:");
      expect(output.toLowerCase()).not.toContain("data:text/html");
      expectFullySanitized(output);
    });
  }

  test("unterminated tag is escaped so later concatenated markup cannot complete it", () => {
    const output = sanitizeRichText("<img src=x onerror=alert(1)");
    expect(output).toBe("&lt;img src=x onerror=alert(1)");
    expect(output.includes("<")).toBe(false);
  });

  test("event handler on an allowed tag is dropped with the tag surviving", () => {
    expect(sanitizeRichText('<b onmouseover="alert(1)">bold</b>')).toBe("<b>bold</b>");
  });

  test("style attribute on an allowed tag is removed", () => {
    expect(sanitizeRichText('<p style="background:url(javascript:alert(1))">x</p>')).toBe("<p>x</p>");
  });

  test("benign editor output survives byte-identical", () => {
    const benign = "<p>Discount for <b>Ramadan</b> camp:</p><ul><li>2 <i>free</i> hours</li></ul>";
    expect(sanitizeRichText(benign)).toBe(benign);
  });
});
/**
 * Plain-text invariant: no raw `<` may survive (tags are stripped and stray
 * angle brackets are escaped), and re-sanitizing is a fixed point.
 */
function expectPlainTextInert(output: string): void {
  expect(output.includes("<")).toBe(false);
  expect(sanitizePlainText(output)).toBe(output);
}

describe("sanitizePlainText — Tier 1: branches", () => {
  test("returns empty string for empty input", () => {
    expect(sanitizePlainText("")).toBe("");
  });

  test("passes plain text through unchanged", () => {
    expect(sanitizePlainText("Override: refund the session")).toBe("Override: refund the session");
  });

  test("strips script tags together with their contents", () => {
    expect(sanitizePlainText("<script>alert(1)</script>Refund approved")).toBe("Refund approved");
  });

  test("strips every tag — no formatting allowlist survives", () => {
    expect(sanitizePlainText("Paid <b>in full</b> on <i>Monday</i>")).toBe("Paid in full on Monday");
  });

  test("truncates over-long input to the default 2000 characters with an ellipsis", () => {
    const input = "x".repeat(2500);
    const output = sanitizePlainText(input);
    expect(output).toHaveLength(2000);
    expect(output).toBe("x".repeat(1999) + "…");
  });

  test("strips markup first and truncates the stripped result", () => {
    const output = sanitizePlainText("<p>paid</p>".repeat(600));
    expect(output).toHaveLength(2000);
    expect(output.startsWith("paid")).toBe(true);
    expect(output.endsWith("…")).toBe(true);
  });
});

describe("sanitizePlainText — Tier 2: boundaries", () => {
  test("exactly maxLength characters pass through unchanged", () => {
    const input = "y".repeat(2000);
    expect(sanitizePlainText(input)).toBe(input);
  });

  test("maxLength + 1 truncates to maxLength including the ellipsis", () => {
    const output = sanitizePlainText("y".repeat(2001));
    expect(output).toHaveLength(2000);
    expect(output).toBe("y".repeat(1999) + "…");
  });

  test("a custom maxLength is honored", () => {
    expect(sanitizePlainText("abcdefghij", 5)).toBe("abcd…");
  });

  test("truncation never splits a surrogate pair", () => {
    const output = sanitizePlainText("😀".repeat(1001));
    expect(output).toHaveLength(1999);
    expect(output.endsWith("😀…")).toBe(true);
  });

  test("unicode and RTL content survive untouched", () => {
    const input = "خصم جزئي — ٣٠٪ من الحصة";
    expect(sanitizePlainText(input)).toBe(input);
  });
});

describe("sanitizePlainText — Tier 3: malformed and adversarial markup", () => {
  test("nested tags collapse to the inner text", () => {
    expect(sanitizePlainText("<div><p><span>deep</span></p></div>")).toBe("deep");
  });

  test("an unterminated tag is escaped so it cannot be completed later", () => {
    expect(sanitizePlainText("<img src=x onerror=alert(1)")).toBe("&lt;img src=x onerror=alert(1)");
  });

  test("input consisting only of tags yields an empty string", () => {
    expect(sanitizePlainText("<p><b><i>")).toBe("");
    expect(sanitizePlainText("<script></script>")).toBe("");
  });

  test("comments and processing instructions are removed", () => {
    expect(sanitizePlainText("a<!-- hidden -->b<?xml version='1.0'?>c")).toBe("abc");
  });

  test("already-escaped entities stay as inert text", () => {
    const input = "&lt;script&gt;alert(1)&lt;/script&gt;";
    expect(sanitizePlainText(input)).toBe(input);
  });

  test("sanitizing twice is a fixed point", () => {
    const dirty = '<p onclick="x()">a</p><script>evil()</script><img src=y onerror=z()><b ok';
    const once = sanitizePlainText(dirty);
    expect(sanitizePlainText(once)).toBe(once);
  });

  test("truncation that lands inside an escaped entity stays inert and stable", () => {
    const input = "a&lt;".repeat(800);
    const output = sanitizePlainText(input);
    expect(output).toHaveLength(2000);
    expectPlainTextInert(output);
  });
});

describe("sanitizePlainText — Tier 4: security battery", () => {
  const NEUTRALIZED_CASES: ReadonlyArray<readonly [string, string]> = [
    ["plain script element", "<script>alert(1)</script>"],
    ["uppercase script element", "<SCRIPT>alert(1)</SCRIPT>"],
    ["script with src attribute", '<script src="https://evil.example/x.js"></script>'],
    ["img onerror handler", "<img src=x onerror=alert(1)>"],
    ["img onerror self-closing", "<img src=x onerror=alert(1)/>"],
    ["javascript: href", '<a href="javascript:alert(1)">click</a>'],
    ["data: URL href", '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
    ["entity-obfuscated javascript: href", '<a href="j&#x61;vascript:alert(1)">x</a>'],
    ["svg onload attribute", "<svg onload=alert(1)>"],
    ["svg wrapping script", "<svg><script>alert(1)</script></svg>"],
    ["iframe with javascript: src", "<iframe src=javascript:alert(1)></iframe>"],
    ["event handler on a formatting tag", '<b onmouseover="alert(1)">bold</b>'],
    ["body event handler", "<body onpageshow=alert(1)>x</body>"],
    ["details ontoggle handler", "<details open ontoggle=alert(1)>x</details>"],
  ];

  for (const [name, payload] of NEUTRALIZED_CASES) {
    test(`neutralizes ${name}`, () => {
      const output = sanitizePlainText(payload);
      expect(output.includes("<")).toBe(false);
      expect(output).not.toMatch(/on\w+\s*=/i);
      expect(output.toLowerCase()).not.toContain("javascript:");
      expect(output.toLowerCase()).not.toContain("data:text/html");
      expectPlainTextInert(output);
    });
  }

  test("bare entity-encoded payloads remain inert literal text", () => {
    const input = "j&#x61;vascript:alert(1) &lt;script&gt;";
    const output = sanitizePlainText(input);
    expect(output).toBe(input);
    expect(output.includes("<")).toBe(false);
  });

  test("a long repeated XSS payload is fully stripped before truncation", () => {
    const output = sanitizePlainText("<img src=x onerror=alert(1)>".repeat(300));
    expect(output).toBe("");
  });
});
