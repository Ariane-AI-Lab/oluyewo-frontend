import { describe, expect, it, vi } from "vitest";
import { readVerificationStream, submitVerification } from "@/lib/verification-api";

describe("verification API stream", () => {
  it("reads progress events and returns the final report", async () => {
    const progress: string[] = [];
    const response = new Response(
      [
        '{"type":"start","etapes":["node_recherche_origine"]}',
        '{"type":"etape_terminee","etape":"node_recherche_origine","libelle":"Recherche d’origine"}',
        '{"type":"resultat","donnees":{"resultat_utilisateur":{"titre":"Rapport"}}}',
      ].join("\n"),
      { headers: { "Content-Type": "application/x-ndjson" } },
    );

    await expect(
      readVerificationStream(response, (message) => progress.push(message)),
    ).resolves.toEqual({
      resultat_utilisateur: { titre: "Rapport" },
    });
    expect(progress).toEqual(["Analyse démarrée…", "Étape terminée : Recherche d’origine"]);
  });

  it("surfaces errors emitted after the stream starts", async () => {
    const response = new Response('{"type":"erreur","detail":"Erreur du moteur"}\n');

    await expect(readVerificationStream(response, () => {})).rejects.toThrow("Erreur du moteur");
  });

  it("shows a useful message when the Gemini quota is exhausted", async () => {
    const response = new Response(
      '{"detail":"RESOURCE_EXHAUSTED: Gemini quota exceeded"}',
      { status: 429 },
    );

    await expect(readVerificationStream(response, () => {})).rejects.toThrow(
      "Le service de vérification a atteint sa limite de quota ou de requêtes.",
    );
  });

  it("shows a temporary service message when the stream reports quota exhaustion", async () => {
    const response = new Response(
      '{"type":"erreur","detail":"RESOURCE_EXHAUSTED: Gemini quota exceeded"}\n',
    );

    await expect(readVerificationStream(response, () => {})).rejects.toThrow(
      "Le service de vérification a atteint sa limite de quota ou de requêtes.",
    );
  });

  it("explains when the verification service is temporarily unavailable", async () => {
    const response = new Response("", { status: 503 });

    await expect(readVerificationStream(response, () => {})).rejects.toThrow(
      "Le service de vérification est temporairement indisponible.",
    );
  });

  it("posts multipart data and does not set the multipart content type manually", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"type":"resultat","donnees":{"classe_ooc":"vrai"}}\n'));
    vi.stubGlobal("fetch", fetchMock);

    try {
      await submitVerification(
        { text: " Vérifier ceci ", imageUrl: "https://example.com/image.jpg" },
        () => {},
      );
    } finally {
      vi.unstubAllGlobals();
    }

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/verify-rumor\/stream$/);
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get("rumor_text")).toBe("Vérifier ceci");
    expect((options.body as FormData).get("image_url")).toBe("https://example.com/image.jpg");
    expect(options.headers).toBeUndefined();
  });

  it("posts an uploaded image in the image_file field", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"type":"resultat","donnees":{"classe_ooc":"faux"}}\n'),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const file = new File(["image"], "photo.png", { type: "image/png" });
      await submitVerification({ text: "Vérifier ceci", file }, () => {});
      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = options.body as FormData;
      expect(body.get("image_file")).toBeInstanceOf(File);
      expect(body.get("image_file")).toMatchObject({ name: "photo.png", type: "image/png" });
      expect(body.get("image_url")).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
