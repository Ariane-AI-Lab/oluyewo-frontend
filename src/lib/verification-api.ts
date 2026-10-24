import { canSubmitVerification } from "@/lib/submission";

export type VerificationResponse = {
  resultat_utilisateur?: {
    titre?: string;
    resume?: string;
    analyse_contexte?: unknown;
    analyse_image_rumeur?: unknown;
    mise_en_relation?: string;
    conclusion?: string;
    avertissement?: string;
    sources?: unknown;
    preuves?: unknown;
    liens_preuve?: unknown;
    liens_preuves?: unknown;
    donnees_techniques?: Record<string, unknown>;
  };
  classe_ooc?: string | null;
  rumor_image?: string;
  rumor_text?: string;
  verification_id?: number;
  sources?: unknown;
  preuves?: unknown;
  liens_preuve?: unknown;
  liens_preuves?: unknown;
  donnees_techniques?: Record<string, unknown>;
  performance_metrics?: Record<string, unknown>;
  donnees_techniques_detail?: Record<string, unknown>;
};

type VerificationStreamEvent =
  | { type: "start"; etapes?: string[] }
  | { type: "etape_terminee"; libelle?: string; etape?: string }
  | { type: "resultat"; donnees: VerificationResponse }
  | { type: "erreur"; detail?: string }
  | { type: string; [key: string]: unknown };

export type VerificationRequest = {
  text: string;
  file?: File | null;
  imageUrl?: string;
};

function getApiBaseUrl(): string {
  return (import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8000").replace(/\/+$/, "");
}

async function getHttpError(response: Response): Promise<Error> {
  const body = await response.text();
  if (body) {
    try {
      const parsed: unknown = JSON.parse(body);
      const detail = getErrorDetail(parsed);
      if (detail) return new Error(formatVerificationError(detail, response.status));
    } catch {
      return new Error(formatVerificationError(body, response.status));
    }
    return new Error(formatVerificationError(body, response.status));
  }
  return new Error(formatVerificationError("", response.status));
}

function getErrorDetail(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  if ("detail" in value && typeof value.detail === "string") return value.detail;
  if ("message" in value && typeof value.message === "string") return value.message;
  if ("error" in value) {
    if (typeof value.error === "string") return value.error;
    if (value.error && typeof value.error === "object" && "message" in value.error && typeof value.error.message === "string") {
      return value.error.message;
    }
  }
  return undefined;
}

function formatVerificationError(detail: string, status?: number): string {
  const normalized = detail.toLowerCase();
  if (
    status === 429 ||
    /resource_exhausted|quota|rate.?limit|too many requests/.test(normalized)
  ) {
    return "Le service de vérification a atteint sa limite de quota ou de requêtes. Votre demande n’a pas pu être analysée. Veuillez réessayer plus tard.";
  }
  if (status === 503 || status === 502 || status === 504) {
    return "Le service de vérification est temporairement indisponible. Votre demande n’a pas pu être analysée. Veuillez réessayer dans quelques instants.";
  }
  if (detail.trim()) return detail;
  return `Le serveur n’a pas pu terminer la vérification (statut ${status ?? "inconnu"}).`;
}

function parseEvent(line: string): VerificationStreamEvent {
  try {
    const event: unknown = JSON.parse(line);
    if (event && typeof event === "object" && "type" in event && typeof event.type === "string") {
      return event as VerificationStreamEvent;
    }
  } catch {
    throw new Error("Le serveur a envoyé un événement de vérification invalide.");
  }
  throw new Error("Le serveur a envoyé un événement de vérification invalide.");
}

export async function readVerificationStream(
  response: Response,
  onProgress: (message: string) => void,
): Promise<VerificationResponse> {
  if (!response.ok) throw await getHttpError(response);
  if (!response.body) throw new Error("Le serveur n’a pas fourni de flux de vérification.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: VerificationResponse | undefined;

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    const event = parseEvent(line);
    switch (event.type) {
      case "start":
        onProgress("Analyse démarrée…");
        break;
      case "etape_terminee":
        onProgress(
          event.libelle
            ? `Étape terminée : ${event.libelle}`
            : "Une étape de l’analyse est terminée.",
        );
        break;
      case "resultat":
        if (!("donnees" in event) || !event.donnees || typeof event.donnees !== "object") {
          throw new Error("Le serveur a envoyé un résultat de vérification invalide.");
        }
        result = event.donnees;
        break;
      case "erreur":
        throw new Error(
          formatVerificationError(
            typeof event.detail === "string" ? event.detail : "",
          ),
        );
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) handleLine(line);
      if (done) break;
    }
    if (buffer.trim()) handleLine(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!result) throw new Error("Le flux s’est terminé sans résultat de vérification.");
  return result;
}

export async function submitVerification(
  request: VerificationRequest,
  onProgress: (message: string) => void,
  signal?: AbortSignal,
): Promise<VerificationResponse> {
  const file = request.file ?? null;
  const imageUrl = request.imageUrl?.trim() ?? "";
  const imageCount = Number(Boolean(file)) + Number(Boolean(imageUrl));

  if (!canSubmitVerification(request.text, imageCount)) {
    throw new Error("Saisissez un texte et joignez une seule image (fichier ou URL).");
  }

  const form = new FormData();
  form.append("rumor_text", request.text.trim());
  if (file) form.append("image_file", file);
  else form.append("image_url", imageUrl);

  const response = await fetch(`${getApiBaseUrl()}/verify-rumor/stream`, {
    method: "POST",
    body: form,
    ...(signal ? { signal } : {}),
  });
  return readVerificationStream(response, onProgress);
}
