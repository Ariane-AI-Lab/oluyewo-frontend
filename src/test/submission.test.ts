import { describe, expect, it } from "vitest";
import { canSubmitVerification, isImageFile } from "@/lib/submission";

describe("Mandatory image and text", () => {
  it("rejects text without an image", () => {
    expect(canSubmitVerification("Une rumeur", 0)).toBe(false);
  });
  it("rejects an image without nonblank text", () => {
    expect(canSubmitVerification("", 1)).toBe(false);
    expect(canSubmitVerification("   ", 1)).toBe(false);
  });
  it("accepts text with an uploaded image or validated image URL", () => {
    expect(canSubmitVerification("Une rumeur", 1)).toBe(true);
  });
  it("accepts image files but rejects non-image attachments", () => {
    expect(isImageFile({ type: "image/png" })).toBe(true);
    expect(isImageFile({ type: "application/pdf" })).toBe(false);
  });
});