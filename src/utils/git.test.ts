import { test, expect, describe } from "bun:test";
import { sanitizeBranchForDir } from "./git.ts";

describe("sanitizeBranchForDir", () => {
  test("replaces forward slashes with dashes", () => {
    expect(sanitizeBranchForDir("feat/new-feature")).toBe("feat-new-feature");
  });

  test("handles multiple slashes", () => {
    expect(sanitizeBranchForDir("feat/ui/button")).toBe("feat-ui-button");
  });

  test("returns unchanged string without slashes", () => {
    expect(sanitizeBranchForDir("feature-branch")).toBe("feature-branch");
  });

  test("handles empty string", () => {
    expect(sanitizeBranchForDir("")).toBe("");
  });

  test("handles single character", () => {
    expect(sanitizeBranchForDir("a")).toBe("a");
  });

  test("handles trailing slash", () => {
    expect(sanitizeBranchForDir("feature/")).toBe("feature-");
  });

  test("handles leading slash", () => {
    expect(sanitizeBranchForDir("/feature")).toBe("-feature");
  });
});
