import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names in order", () => {
    expect(cn("base", false, "active", null, undefined, "lg")).toBe(
      "base active lg",
    );
  });
});
