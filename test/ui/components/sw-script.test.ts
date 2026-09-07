import { describe, expect, it } from "bun:test";

const generateSwScript = (buildId: string | undefined): string => {
  return (
    "if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('/sw.js?build=" +
    encodeURIComponent(buildId ?? "").replace(/'/g, "%27") +
    "').catch(function(){});}"
  );
};

describe("Service Worker Script Generation", () => {
  it("encodes standard build ID string correctly", () => {
    const script = generateSwScript("v1.0.0");
    expect(script).toBe(
      "if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('/sw.js?build=v1.0.0').catch(function(){});}"
    );
  });

  it("handles undefined build ID gracefully", () => {
    const script = generateSwScript(undefined);
    expect(script).toBe(
      "if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('/sw.js?build=').catch(function(){});}"
    );
  });

  it("safely encodes malicious injection attempts with single quotes and JS statements", () => {
    const maliciousBuildId = "'; alert(1); //";
    const script = generateSwScript(maliciousBuildId);

    // Single quote and spaces should be URL encoded (%27, %20, %2F)
    expect(script).not.toContain("'; alert(1)");
    expect(script).toBe(
      "if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('/sw.js?build=%27%3B%20alert(1)%3B%20%2F%2F').catch(function(){});}"
    );
  });

  it("safely encodes HTML closing script tags", () => {
    const maliciousBuildId = "</script><script>alert(1)</script>";
    const script = generateSwScript(maliciousBuildId);

    expect(script).not.toContain("</script>");
    expect(script).toBe(
      "if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('/sw.js?build=%3C%2Fscript%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E').catch(function(){});}"
    );
  });
});
