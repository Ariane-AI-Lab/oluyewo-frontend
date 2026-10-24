import { beforeEach, describe, expect, it } from "vitest";
import { loadUser, mockLogin, mockLogout } from "@/lib/mock-auth";

describe("mock registration profile", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores the required name and first name with the user profile", () => {
    const user = mockLogin("test@example.com", { nom: "  Adjei ", prenom: " Ama " });

    expect(user).toMatchObject({
      email: "test@example.com",
      nom: "Adjei",
      prenom: "Ama",
    });
    expect(loadUser()).toEqual(user);
  });

  it("keeps sign-in without registration fields compatible", () => {
    const user = mockLogin("test@example.com");

    expect(user).toMatchObject({ email: "test@example.com" });
    expect(user).not.toHaveProperty("nom");
    expect(user).not.toHaveProperty("prenom");
  });

  it("clears registration profile on logout", () => {
    mockLogin("test@example.com", { nom: "Adjei", prenom: "Ama" });

    mockLogout();

    expect(loadUser()).toBeNull();
  });
});
