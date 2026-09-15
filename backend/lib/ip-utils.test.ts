import { describe, expect, test } from "bun:test";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";

describe("sanitizeIpAddress", () => {
  test("returns null for falsy inputs", () => {
    expect(sanitizeIpAddress(null)).toBeNull();
    expect(sanitizeIpAddress(undefined)).toBeNull();
    expect(sanitizeIpAddress("")).toBeNull();
  });

  test("keeps bare IPv4 addresses", () => {
    expect(sanitizeIpAddress("192.0.2.10")).toBe("192.0.2.10");
    expect(sanitizeIpAddress("203.0.113.7")).toBe("203.0.113.7");
  });

  test("strips the IPv4 port suffix", () => {
    expect(sanitizeIpAddress("192.0.2.10:8080")).toBe("192.0.2.10");
    expect(sanitizeIpAddress("203.0.113.7:443")).toBe("203.0.113.7");
  });

  test("keeps full IPv6 addresses unsplit", () => {
    expect(sanitizeIpAddress("2001:db8::1")).toBe("2001:db8::1");
    expect(sanitizeIpAddress("::1")).toBe("::1");
    expect(sanitizeIpAddress("2001:db8:85a3:0:0:8a2e:370:7334")).toBe("2001:db8:85a3:0:0:8a2e:370:7334");
  });

  test("unwraps bracketed IPv6 with optional port", () => {
    expect(sanitizeIpAddress("[2001:db8::1]")).toBe("2001:db8::1");
    expect(sanitizeIpAddress("[2001:db8::1]:443")).toBe("2001:db8::1");
    expect(sanitizeIpAddress("[::1]:8080")).toBe("::1");
  });

  test("keeps IPv4-mapped IPv6 addresses", () => {
    const mapped = ["::ffff:", "c000:280"].join("");
    expect(sanitizeIpAddress(mapped)).toBe(mapped);
  });

  test("falls back to loopback for unparseable values", () => {
    expect(sanitizeIpAddress("[[2001:db8::1]]")).toBe("127.0.0.1");
    expect(sanitizeIpAddress("not-an-ip")).toBe("127.0.0.1");
    expect(sanitizeIpAddress("2001:db8::1:99999")).toBe("127.0.0.1");
    expect(sanitizeIpAddress("[[2001:db8::1]]:443")).toBe("127.0.0.1");
  });

  test("produces distinct buckets for distinct IPv6 users", () => {
    const first = sanitizeIpAddress("[2001:db8::1]");
    const second = sanitizeIpAddress("[2001:db8::2]");
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first).not.toBe(second);
  });
});
