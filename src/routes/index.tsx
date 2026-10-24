import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { canSubmitVerification, isImageFile } from "@/lib/submission";
import { submitVerification, type VerificationResponse } from "@/lib/verification-api";
import { AuthModal } from "@/components/AuthModal";
import {
  initials,
  loadHistory,
  loadUser,
  mockLogin,
  mockLogout,
  saveHistory,
  type Investigation,
  type MockUser,
  type StoredMessage,
} from "@/lib/mock-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oluyẹwo — Nouvelle vérification" },
      { name: "description", content: "Vérifiez si une image associée à une rumeur est détournée de son contexte avec Oluyẹwo." },
      { property: "og:title", content: "Oluyẹwo — Nouvelle vérification" },
      { property: "og:description", content: "Vérifiez si une image associée à une rumeur est détournée de son contexte avec Oluyẹwo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LOGO = "/oluyewo-logo.png";
const DOC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBaW4s1ZaUr_INyvwdrB49UfXBgc1pIct2rqbsobFYvYLmh6iUYS9yWdYp6maXCcEod89xWgp_p6RhUUrdpuo69fPZb4O_u-kW86x_-VMDP4SwMUxKyTVdQblUyIUNtaWUVzjBr-67xl41Iem8ZC5zLsTF2JSbYJ8-CdfPDEtFh-0M7VOA3zf1TCkx0FGpxI0Fhg69atAwHMAndmhB01nFaDIa6NU8nUbF439Ls0H4kaoGA3mOF7r6q";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const SourceChip = ({ href, icon, children }: { href: string; icon: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="mx-0.5 inline-flex items-center gap-0.5 rounded border border-slate-line/60 bg-surface-slate px-1 align-baseline text-[10px] leading-[14px] font-medium text-on-variant transition-colors hover:text-primary"
  >
    <Icon name={icon} className="text-[10px]" />
    {children}
  </a>
);

const sources = [
  { href: "https://sgg.gouv.bj/journal-officiel", org: "Journal Officiel Bénin", title: "Recueil des concours & décrets légaux", desc: "Recherche de correspondances d'arrêtés ministériels pour l'exercice 2024-2025.", domain: "sgg.gouv.bj" },
  { href: "https://douanes.gouv.bj/actualites/dementi", org: "Douanes Béninoises", title: "Alerte officielle : Tentative d'escroquerie", desc: "Mise en garde contre les faux avis de recrutement via Mobile Money.", domain: "douanes.gouv.bj" },
  { href: "https://beninwebtv.com/factcheck-douane", org: "Fact-Check Média", title: "Analyse médico-légale du cachet", desc: "Examen de superposition montrant le détournement d'une note de 2021.", domain: "beninwebtv.com" },
];

const metrics = [
  { label: "Niveau de confiance", value: "98%", cls: "text-primary" },
  { label: "Authenticité image (ELA)", value: "2% (falsifié)", cls: "text-tertiary" },
  { label: "Temps d'analyse", value: "1.2s", cls: "text-foreground" },
  { label: "Sources croisées", value: "8 registres", cls: "text-primary" },
];

const exampleShareText =
  "Cette image est détournée de son contexte. Le communiqué de recrutement partagé est une fabrication frauduleuse. Sources : sgg.gouv.bj, douanes.gouv.bj et beninwebtv.com.";

const actionBtn =
  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-on-variant transition-colors hover:bg-surface-low hover:text-foreground";

type Chip = { id: number; type: "image" | "link"; text: string; src: string };
type Message = StoredMessage & { status?: string; error?: string };

type ProofCard = { url: string; title: string; description?: string };
type SummaryLink = { url: string; title: string };

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const firstString = (record: Record<string, unknown>, keys: string[]) =>
  keys.map((key) => record[key]).find((value): value is string => typeof value === "string" && Boolean(value.trim()));

const extractSummaryLinks = (summary: string): SummaryLink[] => {
  const links: SummaryLink[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
  for (const match of summary.matchAll(pattern)) {
    const rawUrl = match[2] ?? match[3];
    if (!rawUrl) continue;
    const urlText = match[2] ? rawUrl : rawUrl.replace(/[.,;:!?)}\]]+$/, "");
    try {
      const url = new URL(urlText);
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      links.push({ url: url.href, title: match[1] ?? url.hostname });
    } catch {
      continue;
    }
  }
  return links;
};

const SummaryText = ({ text, links }: { text: string; links: SummaryLink[] }) => {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const rawUrl = match[2] ?? match[3];
    if (!rawUrl) continue;
    const urlText = match[2] ? rawUrl : rawUrl.replace(/[.,;:!?)}\]]+$/, "");
    const end = start + (match[2] ? match[0].length : urlText.length);
    let url: URL;
    try {
      url = new URL(urlText);
    } catch {
      continue;
    }
    const link = links.find((candidate) => candidate.url === url.href);
    if (!link) continue;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <a
        key={`${url.href}-${start}`}
        href={url.href}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
      >
        {match[1] ?? urlText}
      </a>,
    );
    cursor = end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
};

const normalizeProofs = (report: VerificationResponse, summaryLinks: SummaryLink[]): ProofCard[] => {
  const result = report.resultat_utilisateur;
  const values = [
    report.sources,
    report.preuves,
    report.liens_preuve,
    report.liens_preuves,
    result?.sources,
    result?.preuves,
    result?.liens_preuve,
    result?.liens_preuves,
  ];
  const proofs: ProofCard[] = [];
  for (const value of values) {
    const entries = Array.isArray(value) ? value : value ? [value] : [];
    for (const entry of entries) {
      const record = asRecord(entry);
      const rawUrl = typeof entry === "string" ? entry : record && firstString(record, ["url", "href", "lien", "link"]);
      if (!rawUrl) continue;
      try {
        const url = new URL(rawUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") continue;
        if (proofs.some((proof) => proof.url === url.href)) continue;
        const description = record && firstString(record, ["description", "desc", "extrait"]);
        proofs.push({
          url: url.href,
          title:
            (record && firstString(record, ["title", "titre", "label", "nom", "name"])) ||
            url.hostname,
          ...(description ? { description } : {}),
        });
      } catch {
        continue;
      }
    }
  }
  for (const link of summaryLinks) {
    if (!proofs.some((proof) => proof.url === link.url)) {
      proofs.push({ url: link.url, title: link.title });
    }
  }
  return proofs;
};

const technicalLabels: Record<string, string> = {
  classe_ooc: "Résultat du contexte",
  score_semantique: "Score sémantique",
  score_entites: "Correspondance des entités",
  classe_visual: "Analyse visuelle",
  score_visual: "Score visuel",
  entites_rumeur: "Entités dans la rumeur",
  entites_source: "Entités dans les sources",
};

const technicalKeys = Object.keys(technicalLabels);

const normalizeEntityValues = (value: unknown): { category?: string; name: string }[] => {
  const values: { category?: string; name: string }[] = [];
  const add = (entry: unknown, category?: string) => {
    if (typeof entry === "string" || typeof entry === "number") {
      const name = String(entry).trim();
      if (typeof entry === "string" && (name.startsWith("{") || name.startsWith("["))) {
        try {
          const parsed: unknown = JSON.parse(name);
          if (parsed && typeof parsed === "object") {
            add(parsed, category);
            return;
          }
        } catch {
          // Keep non-JSON entity names as plain text.
        }
      }
      if (name) values.push({ ...(category ? { category } : {}), name });
      return;
    }
    if (Array.isArray(entry)) {
      entry.forEach((item) => add(item, category));
      return;
    }
    const record = asRecord(entry);
    if (!record) return;

    const name = firstString(record, ["name", "nom", "text", "texte", "value", "valeur", "entity", "entite"]);
    if (name) {
      const type = firstString(record, ["type", "label", "categorie", "category"]);
      values.push({ ...(type ? { category: type } : category ? { category } : {}), name });
      return;
    }
    for (const [key, nested] of Object.entries(record)) {
      add(nested, key);
    }
  };

  add(value);
  return values;
};

const formatTechnicalValue = (key: string, value: unknown): ReactNode => {
  if (key === "classe_ooc" && typeof value === "string") {
    const classification: Record<string, string> = {
      ooc: "Détournement de contexte",
      nooc: "Contexte conforme",
    };
    return classification[value.toLowerCase()] ?? value;
  }
  if (key === "classe_visual" && typeof value === "string") {
    return value.replace(/[_-]+/g, " ").replace(/^./, (character) => character.toUpperCase());
  }
  if (key.startsWith("score_") && typeof value === "number" && value >= 0 && value <= 1) {
    return `${Math.round(value * 100)} %`;
  }
  if (key === "entites_rumeur" || key === "entites_source") {
    const entities = normalizeEntityValues(value);
    return (
      entities.length > 0
        ? <ul className="flex flex-col gap-1.5">
            {entities.map(({ category, name }, index) => (
              <li key={`${category ?? ""}-${name}-${index}`} className="flex flex-wrap items-center gap-1.5">
                {category && <span className="text-[10px] font-semibold uppercase tracking-wide text-outline">{category.replace(/[_-]+/g, " ")}</span>}
                <span className="rounded-full bg-surface-low px-2 py-1 text-sm text-foreground">{name}</span>
              </li>
            ))}
          </ul>
        : <span className="text-on-variant">Aucune entité</span>
    );
  }
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
};

const VerificationSummary = ({ report }: { report: VerificationResponse }) => {
  const summary = report.resultat_utilisateur?.resume?.trim() ?? "";
  if (!summary) return null;
  const links = extractSummaryLinks(summary);

  return (
    <div className="rounded-2xl rounded-tl-none border border-slate-line bg-surface-lowest p-4 text-base leading-7 text-foreground shadow-sm sm:p-5">
      <p className="whitespace-pre-wrap break-words"><SummaryText text={summary} links={links} /></p>
    </div>
  );
};

const VerificationReport = ({
  report,
  onCopy,
  onShare,
  copied,
}: {
  report: VerificationResponse;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  copied: boolean;
}) => {
  const result = report.resultat_utilisateur;
  const technicalData: Record<string, unknown> = {
    ...(result?.donnees_techniques ?? {}),
    ...(report.donnees_techniques ?? {}),
    ...(report.donnees_techniques_detail ?? {}),
  };
  if (report.classe_ooc && !("classe_ooc" in technicalData)) {
    technicalData["classe_ooc"] = report.classe_ooc;
  }
  const technicalEntries = technicalKeys
    .filter((key) => technicalData[key] !== null && technicalData[key] !== undefined && technicalData[key] !== "")
    .map((key) => [key, technicalData[key]] as const);
  const summary = result?.resume?.trim() ?? "";
  const summaryLinks = extractSummaryLinks(summary);
  const proofs = normalizeProofs(report, summaryLinks);
  const shareText = [summary, ...proofs.map((proof) => `${proof.title}: ${proof.url}`)].filter(Boolean).join("\n\n");

  return (
    <div className="flex w-full flex-col gap-3">
      {proofs.length > 0 && (
        <div className="flex snap-x gap-3 overflow-x-auto pb-1" aria-label="Liens de preuve">
          {proofs.map((proof) => (
            <a
              key={proof.url}
              href={proof.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-56 shrink-0 snap-start flex-col gap-2 rounded-xl border border-slate-line bg-surface-lowest p-3 transition-colors hover:bg-surface-low"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <Icon name="link" className="text-[18px] text-primary" />
                <span className="truncate">{proof.title}</span>
              </span>
              {proof.description && <span className="line-clamp-2 text-xs leading-relaxed text-on-variant">{proof.description}</span>}
              <span className="truncate text-xs text-outline">{new URL(proof.url).hostname}</span>
            </a>
          ))}
        </div>
      )}
      {technicalEntries.length > 0 && (
        <details className="overflow-hidden rounded-xl border border-slate-line/70 bg-surface-low/70 text-on-variant">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-outline hover:bg-surface-high/50">
            Données techniques
            <Icon name="expand_more" className="text-[16px]" />
          </summary>
          <dl className="grid grid-cols-1 gap-2 border-t border-slate-line/60 px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
            {technicalEntries.map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1 rounded-lg bg-surface-lowest/70 p-2.5">
                <dt className="flex flex-col text-xs font-semibold text-outline">
                  <span>{technicalLabels[key] ?? key.replace(/[_-]+/g, " ")}</span>
                  {technicalLabels[key] && <span className="font-mono text-[10px] font-normal">{key}</span>}
                </dt>
                <dd className="break-words text-base font-medium text-foreground">{formatTechnicalValue(key, value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <div className="flex items-center gap-1">
        <Button variant="ghost" onClick={() => onCopy(shareText)} className={actionBtn}>
          <Icon name={copied ? "check" : "content_copy"} className="text-[18px]" />
          {copied ? "Copié !" : "Copier"}
        </Button>
        <Button variant="ghost" onClick={() => onShare(shareText)} className={actionBtn}>
          <Icon name="share" className="text-[18px]" />
          Partager
        </Button>
      </div>
    </div>
  );
};

function Index() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [history, setHistory] = useState<Investigation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [validatingImage, setValidatingImage] = useState(false);
  const [showImageUrl, setShowImageUrl] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sent, setSent] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestController = useRef<AbortController | null>(null);
  const tutorialSteps = 3;

  useEffect(() => {
    const u = loadUser();
    if (u) { setUser(u); setHistory(loadHistory(u.email)); }
  }, []);

  const addChip = (type: Chip["type"], text: string, src: string): boolean => {
    if (chips.length > 0) {
      setAttachmentError("Une seule image peut être envoyée par vérification.");
      return false;
    }
    setChips([{ id: Date.now() + Math.random(), type, text, src }]);
    setAttachmentError("");
    return true;
  };
  const canSend = canSubmitVerification(input, chips.length) && !validatingImage;
  const reset = () => {
    requestController.current?.abort();
    requestController.current = null;
    setIsSubmitting(false);
    setActionMessage("");
    setSent([]); setInput(""); setChips([]); setSelectedFile(null); setCurrentId(null); setShowExample(false); setAttachmentError(""); setShowImageUrl(false); setImageUrlInput("");
  };
  const attachUrl = () => {
    const value = imageUrlInput.trim();
    if (!value) {
      setAttachmentError("Collez d’abord le lien public de l’image.");
      return;
    }
    let url: URL;
    try {
      url = new URL(value);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid URL");
    } catch {
      setAttachmentError("Veuillez saisir une URL d’image valide (http ou https).");
      return;
    }
    setValidatingImage(true);
    setAttachmentError("");
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.onload = null; image.onerror = null;
      setValidatingImage(false);
      setAttachmentError("L’image ne répond pas. Essayez une autre URL ou téléversez le fichier.");
    }, 15000);
    image.onload = () => {
      window.clearTimeout(timer);
      addChip("link", url.hostname + url.pathname, url.href);
      setValidatingImage(false);
      setShowImageUrl(false);
      setImageUrlInput("");
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      setAttachmentError(
        "Cette URL ne charge pas une image accessible. Téléversez l’image ou essayez une autre URL.",
      );
      setValidatingImage(false);
    };
    image.src = url.href;
  };

  const submit = async () => {
    if (!canSend || isSubmitting) return;
    const messageId = Date.now() + Math.random();
    const message: Message = { id: messageId, text: input.trim(), images: [...chips] };
    const next = [...sent, message];
    const text = input.trim();
    const file = selectedFile;
    const imageUrl = chips[0]?.type === "link" ? chips[0].src : undefined;
    const conversationId = currentId ?? `inv-${Date.now().toString(36)}`;
    setSent(next);
    setShowExample(false);
    setInput("");
    setChips([]);
    setSelectedFile(null);
    setIsSubmitting(true);

    const persistConversation = (messages: Message[]) => {
      if (!user) return;
      const storedMessages: StoredMessage[] = messages.map(
        ({ id, text: messageText, images, verification, error }) => ({
          text: messageText,
          images,
          ...(id === undefined ? {} : { id }),
          ...(verification ? { verification } : {}),
          ...(error ? { error } : {}),
        }),
      );
      const currentHistory = loadHistory(user.email);
      const existing = currentHistory.find((item) => item.id === conversationId);
      const item: Investigation = {
        id: conversationId,
        title: existing?.title ?? (messages[0]?.text ?? "Enquête").slice(0, 60),
        messages: storedMessages,
        updatedAt: Date.now(),
      };
      const list = [item, ...currentHistory.filter((entry) => entry.id !== conversationId)];
      setHistory(list);
      setCurrentId(conversationId);
      saveHistory(user.email, list);
    };

    if (user) {
      persistConversation(next);
    }

    const controller = new AbortController();
    requestController.current = controller;
    try {
      const verification = await submitVerification(
        { text, file, ...(imageUrl ? { imageUrl } : {}) },
        (status) =>
          setSent((messages) =>
            messages.map((item) => (item.id === messageId ? { ...item, status } : item)),
          ),
        controller.signal,
      );
      const updatedMessages = next.map((item) =>
        item.id === messageId ? { ...item, verification } : item,
      );
      setSent(updatedMessages);
      persistConversation(updatedMessages);
    } catch (error) {
      if (!controller.signal.aborted) {
        const messageError =
          error instanceof Error ? error.message : "Une erreur inconnue a empêché la vérification.";
        const failedMessages = next.map((item) =>
          item.id === messageId ? { ...item, error: messageError } : item,
        );
        setSent(failedMessages);
        persistConversation(failedMessages);
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setIsSubmitting(false);
      }
    }
  };

  const openInvestigation = (h: Investigation) => {
    requestController.current?.abort();
    requestController.current = null;
    setIsSubmitting(false);
    setCurrentId(h.id); setSent(h.messages); setShowExample(false); setInput(""); setChips([]); setSelectedFile(null); setAttachmentError("");
  };
  const login = (email: string, registration?: { nom: string; prenom: string }) => {
    const u = mockLogin(email, registration);
    setUser(u); setHistory(loadHistory(u.email)); setAuthMode(null);
  };
  const logout = () => {
    mockLogout(); setUser(null); setHistory([]); reset();
  };
  const openTutorial = () => {
    setTutorialStep(0);
    setTutorialOpen(true);
  };

  const copy = async (text: string) => {
    setActionMessage("");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setActionMessage("Le résumé et les liens de preuve ont été copiés.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setActionMessage("Impossible de copier le résultat. Vérifiez les autorisations du navigateur.");
    }
  };

  const share = async (text: string) => {
    setActionMessage("");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Vérification Oluyẹwo", text });
        setActionMessage("");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setActionMessage("Le partage natif n’est pas disponible : le résumé a été copié.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copiez ce résultat pour le partager :", text);
    }
  };

  const toolBtn = "rounded-lg p-2 text-on-variant transition-colors hover:bg-surface-low hover:text-primary";

  return (
    <div className="app-canvas min-h-screen font-sans text-foreground">
      <header className="app-header fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-line px-4">
        <Button variant="ghost" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "Réduire le menu" : "Ouvrir le menu"} aria-expanded={sidebarOpen} aria-controls="verification-sidebar" title={sidebarOpen ? "Réduire le menu" : "Ouvrir le menu"} className="h-11 gap-3 px-2">
          <Icon name={sidebarOpen ? "menu_open" : "menu"} className="text-[24px] text-on-variant" />
          <img src={LOGO} alt="Oluyẹwo" className="h-8 max-w-[180px] object-contain" />
        </Button>
        {user ? (
          <Link
            to="/me"
            aria-label="Mon profil"
            title="Mon profil"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-variant transition-colors hover:bg-surface-low hover:text-foreground"
          >
            <Icon name="person" className="text-[24px]" />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setAuthMode("signin")} className="text-sm font-semibold text-on-variant">Se connecter</Button>
            <Button onClick={() => setAuthMode("signup")} className="hidden rounded-lg text-sm font-semibold sm:inline-flex">Créer un compte</Button>
          </div>
        )}
      </header>
      <aside id="verification-sidebar" inert={!sidebarOpen} className={`fixed bottom-0 left-0 top-16 z-40 overflow-hidden border-r border-slate-line bg-surface-low/95 px-0 py-6 shadow-sm backdrop-blur-xl transition-[width,transform] duration-300 motion-reduce:transition-none ${sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full border-r-0"}`}>
        <div className="flex w-72 flex-col gap-6 px-2">
          <div className="px-2 pt-3">
            <Button variant="ghost"
              onClick={reset}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-md shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-lg"
            >
              <Icon name="add" className="text-[20px]" />
              Nouvelle vérification
            </Button>
          </div>
          {user ? (
            <div className="flex flex-col gap-2 px-2">
              <span className="px-2 text-sm font-semibold uppercase tracking-wider text-outline">Enquêtes Récentes</span>
              <nav className="flex flex-col gap-1">
                {history.length === 0 && <p className="px-2 text-sm text-on-variant">Aucune enquête enregistrée pour le moment.</p>}
                {history.map((h) => (
                  <Button variant="ghost" key={h.id} onClick={() => openInvestigation(h)} title={h.title}
                    className={`justify-start truncate rounded-xl px-3 py-3 text-left text-sm transition-colors ${currentId === h.id ? "bg-surface-highest font-semibold text-foreground shadow-sm" : "text-on-variant hover:bg-surface-high hover:text-foreground"}`}>
                    <span className="truncate">{h.title}</span>
                  </Button>
                ))}
              </nav>
            </div>
          ) : (
            <div className="mx-2 flex flex-col gap-3 rounded-xl border border-slate-line bg-surface p-4">
              <Icon name="history" className="text-[22px] text-primary" />
              <p className="text-sm leading-relaxed text-on-variant">Connectez-vous ou inscrivez-vous pour sauvegarder vos enquêtes.</p>
              <Button onClick={() => setAuthMode("signin")} className="rounded-lg font-semibold">Se connecter</Button>
            </div>
          )}
        </div>
        {user && (
          <div className="absolute inset-x-0 bottom-0 flex w-72 justify-end border-t border-slate-line bg-surface-low p-3">
            <Button variant="ghost" onClick={logout} title="Se déconnecter" aria-label="Se déconnecter" className="h-9 px-2 text-on-variant hover:text-destructive">
              <Icon name="logout" className="text-[20px]" />
            </Button>
          </div>
        )}
      </aside>
      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} onLogin={login} />}

      <div className={`transition-[padding] duration-300 motion-reduce:transition-none ${sidebarOpen ? "md:pl-72" : "pl-0"}`}>
        <main className="relative w-full pt-16">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-6 py-6 pb-64">
            <section className="flex flex-col gap-6">
              {!showExample && sent.length === 0 && (
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-10 text-center sm:py-16">
                  <img src={LOGO} alt="Oluyẹwo" className="h-auto w-44 object-contain sm:w-52" />
                  <div className="flex max-w-2xl flex-col gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Vérifiez le contexte d’une image</h1>
                    <p className="mx-auto max-w-xl text-base leading-7 text-on-variant sm:text-lg">
                      Ajoutez l’image et la rumeur associée pour vérifier si cette image est présentée hors de son contexte d’origine.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button onClick={openTutorial} className="rounded-xl px-5 shadow-md shadow-primary/15">
                      <Icon name="auto_stories" className="text-[18px]" />
                      Revoir le guide
                    </Button>
                    <Button variant="outline" onClick={() => setShowExample(true)} className="rounded-xl">
                      <Icon name="visibility" className="text-[18px]" />
                      Voir l’exemple
                    </Button>
                  </div>
                </div>
              )}
              {!showExample && sent.length === 0 && tutorialOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/25 px-4 py-8 backdrop-blur-[2px]">
                  <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="tutorial-title"
                    className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-line/80 bg-surface-lowest shadow-2xl shadow-foreground/20"
                  >
                    <div className="flex items-center justify-between border-b border-slate-line/70 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <img src={LOGO} alt="" className="h-6 w-auto" />
                        <span className="text-xs font-medium text-outline">Guide de démarrage</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTutorialOpen(false)}
                        aria-label="Fermer le guide"
                        title="Fermer le guide"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-on-variant transition-colors hover:bg-surface-low hover:text-foreground"
                      >
                        <Icon name="close" className="text-[20px]" />
                      </button>
                    </div>
                    <div className="px-5 pb-5 pt-5 sm:px-6">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                          Étape {tutorialStep + 1} sur {tutorialSteps}
                        </span>
                        <div className="flex gap-1.5" aria-hidden="true">
                          {Array.from({ length: tutorialSteps }, (_, index) => (
                            <span
                              key={index}
                              className={`h-1.5 rounded-full transition-all ${index === tutorialStep ? "w-6 bg-primary" : "w-1.5 bg-surface-high"}`}
                            />
                          ))}
                        </div>
                      </div>

                      {tutorialStep === 0 && (
                        <div className="flex min-h-52 flex-col items-center justify-center text-center">
                          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon name="add_photo_alternate" className="text-[28px]" />
                          </span>
                          <h2 id="tutorial-title" className="text-xl font-semibold tracking-tight">Ajoutez l’image et la rumeur</h2>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-on-variant">
                            Joignez une image depuis votre appareil ou avec un lien, puis décrivez la rumeur à laquelle elle est associée.
                          </p>
                          <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <span className="rounded-full bg-surface-low px-3 py-1.5 text-xs font-medium text-on-variant">Image obligatoire</span>
                            <span className="rounded-full bg-surface-low px-3 py-1.5 text-xs font-medium text-on-variant">Texte obligatoire</span>
                          </div>
                        </div>
                      )}

                      {tutorialStep === 1 && (
                        <div className="flex min-h-52 flex-col items-center justify-center text-center">
                          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon name="manage_search" className="text-[28px]" />
                          </span>
                          <h2 id="tutorial-title" className="text-xl font-semibold tracking-tight">Lancez la vérification</h2>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-on-variant">
                            Envoyez votre demande. Le système analyse l’image et l’affirmation, puis affiche le résultat et les sources disponibles.
                          </p>
                          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-line bg-surface-low p-3 text-left">
                            <Icon name="hourglass_top" className="text-[20px] text-primary" />
                            <span className="text-xs leading-5 text-on-variant">La progression et les éventuelles erreurs s’affichent dans la conversation.</span>
                          </div>
                        </div>
                      )}

                      {tutorialStep === 2 && (
                        <div className="flex min-h-52 flex-col items-center justify-center text-center">
                          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon name="fact_check" className="text-[28px]" />
                          </span>
                          <h2 id="tutorial-title" className="text-xl font-semibold tracking-tight">Consultez le résultat</h2>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-on-variant">
                            Après l’analyse, consultez le résumé, les liens vers les sources et les données techniques du rapport. Vous pourrez copier ou partager le résultat.
                          </p>
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-slate-line/70 pt-4">
                        {tutorialStep > 0 ? (
                          <Button variant="ghost" onClick={() => setTutorialStep((step) => step - 1)} className="rounded-xl">
                            <Icon name="arrow_back" className="text-[18px]" />
                            Précédent
                          </Button>
                        ) : (
                          <span />
                        )}
                        {tutorialStep < tutorialSteps - 1 ? (
                          <Button onClick={() => setTutorialStep((step) => step + 1)} className="rounded-xl px-5">
                            Suivant
                            <Icon name="arrow_forward" className="text-[18px]" />
                          </Button>
                        ) : (
                          <Button onClick={() => setTutorialOpen(false)} className="rounded-xl px-5 shadow-md shadow-primary/15">
                            Commencer
                            <Icon name="arrow_forward" className="text-[18px]" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}
              {showExample && <>
              <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-grow bg-surface-high" />
                <span className="rounded-full bg-surface-low px-2 py-1 text-[12px] font-semibold text-on-variant">
                  Aujourd'hui, 14:32 • Dossier vérification #BJ-2025-994
                </span>
                <div className="h-px flex-grow bg-surface-high" />
              </div>

              <div className="ml-auto flex max-w-3xl items-start justify-end gap-3">
                <div className="flex w-full flex-col items-end gap-2">
                  <div className="rounded-2xl rounded-tr-none bg-surface-highest p-6 shadow-sm">
                    <p className="text-base">
                      Ce communiqué annonçant un concours de recrutement direct à la douane béninoise pour ce weekend est-il authentique ?
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-surface-lowest p-2 pr-6 shadow-sm transition-shadow hover:shadow-md">
                    <a href={DOC} target="_blank" rel="noreferrer" className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-high">
                      <img src={DOC} alt="Communiqué de recrutement des douanes soumis" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
                        <Icon name="zoom_in" className="text-[18px] text-surface-lowest" />
                      </div>
                    </a>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">communique_douane_recrutement.jpg</span>
                      <span className="text-[12px] font-semibold text-on-variant">240 Ko • Document JPEG soumis</span>
                    </div>
                    <Icon name="task_alt" className="ml-3 text-[20px] text-primary" />
                  </div>
                  <span className="text-[11px] font-semibold text-outline">Envoyé via Web Client • 14:32</span>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground shadow-sm">{user ? initials(user.email, user.nom, user.prenom) : "IN"}</div>
              </div>

              <div className="mr-auto flex w-full max-w-4xl items-start gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                  <Icon name="smart_toy" className="text-[22px]" />
                </div>
                <div className="flex w-full flex-col gap-6 pt-1">
                  <div className="flex flex-col gap-4 leading-relaxed">
                    <p className="text-[17px] leading-relaxed">
                      <strong className="font-semibold text-primary">Cette image est détournée de son contexte.</strong> Le communiqué partagé sur les réseaux sociaux annonçant une session de recrutement direct de 500 agents à la Direction Générale des Douanes béninoises pour ce week-end est une <strong className="font-semibold">fabrication frauduleuse</strong>. Aucun acte réglementaire ni arrêté portant ouverture de concours de cette nature n'a été publié dans les registres légaux officiels
                      <SourceChip href="https://sgg.gouv.bj/journal-officiel" icon="public">JORB · gouv.bj</SourceChip>.
                    </p>
                    <p className="text-base leading-relaxed text-on-variant">
                      La Direction Générale des Douanes et Droits Indirects a publié un démenti formel confirmant qu'aucun dépôt de dossier avec frais d'inscription payables via Mobile Money n'est requis par l'administration béninoise
                      <SourceChip href="https://douanes.gouv.bj/actualites/dementi" icon="account_balance">douanes.gouv.bj</SourceChip>. Les analyses médico-légales de la capture d'écran révèlent un montage utilisant des en-têtes et cachets numérisés provenant d'un avis d'affectation officiel daté de 2021
                      <SourceChip href="https://beninwebtv.com/factcheck-douane" icon="newspaper">Bénin Web TV</SourceChip>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-outline">
                      <Icon name="verified" className="text-[16px] text-primary" />
                      Sources &amp; preuves vérifiées
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {sources.map((s) => (
                        <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col justify-between gap-2 rounded-xl border border-slate-line bg-surface-lowest p-3 transition-all hover:bg-surface-low hover:shadow-sm">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] font-medium text-outline">
                              <span>{s.org}</span>
                              <Icon name="arrow_outward" className="text-[14px] text-primary transition-transform group-hover:translate-x-0.5" />
                            </div>
                            <div className="text-[13px] font-semibold leading-snug">{s.title}</div>
                            <p className="line-clamp-2 text-[12px] text-on-variant">{s.desc}</p>
                          </div>
                          <span className="font-mono text-[11px] text-primary">{s.domain}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 border-t border-slate-line/60 pt-1">
                    <Button variant="ghost" onClick={() => copy(exampleShareText)} className={actionBtn}>
                      <Icon name={copied ? "check" : "content_copy"} className="text-[18px]" />
                      {copied ? "Copié !" : "Copier"}
                    </Button>
                    <Button variant="ghost" onClick={() => share(exampleShareText)} className={actionBtn}>
                      <Icon name="share" className="text-[18px]" />
                      Partager
                    </Button>
                    <div className="mx-1 h-4 w-px bg-slate-line" />
                    <Button variant="ghost" onClick={() => setVote("up")} title="Réponse utile" className={`rounded-lg p-1.5 hover:bg-surface-low hover:text-primary ${vote === "up" ? "text-primary" : "text-on-variant"}`}>
                      <Icon name="thumb_up" className="text-[18px]" />
                    </Button>
                    <Button variant="ghost" onClick={() => setVote("down")} title="Réponse inexacte" className={`rounded-lg p-1.5 hover:bg-surface-low hover:text-destructive ${vote === "down" ? "text-destructive" : "text-on-variant"}`}>
                      <Icon name="thumb_down" className="text-[18px]" />
                    </Button>
                  </div>

                  <details className="group overflow-hidden rounded-xl border border-slate-line bg-surface-lowest">
                    <summary className="flex cursor-pointer list-none select-none items-center justify-between px-4 py-2.5 text-[13px] font-medium text-on-variant hover:bg-surface-low/50 hover:text-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="psychology" className="text-[18px] text-primary" />
                        Afficher la réflexion approfondie et les métriques
                      </div>
                      <Icon name="expand_more" className="text-[18px] transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-3 border-t border-slate-line bg-surface-slate px-4 py-3.5 text-[12px] text-on-variant">
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                        {metrics.map((m) => (
                          <div key={m.label} className="flex flex-col gap-0.5 rounded-lg border border-slate-line bg-surface-lowest p-2.5">
                            <span className="text-[11px] font-semibold text-outline">{m.label}</span>
                            <span className={`text-[15px] font-bold ${m.cls}`}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg border border-slate-line bg-surface-lowest p-3 font-mono text-[11px] leading-relaxed">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Icon name="terminal" className="text-[13px]" />
                          Traces des agents de vérification
                        </div>
                        <p>• Extraction des entités : « Concours Douane Bénin 2025 », « Avis de recrutement direct ».</p>
                        <p>• Interrogation JORB (sgg.gouv.bj) : 0 résultat trouvé correspondant à un arrêté ministériel d'ouverture.</p>
                        <p>• Détection ELA : discordance nette de compression sur la signature et le cachet rond officiel.</p>
                        <p>• Statut de convergence : 98% certitude de contrefaçon.</p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              </>}
              {sent.map((m, i) => (
                <div key={m.id ?? i} className="flex flex-col gap-6">
                  <div className="ml-auto flex w-full max-w-3xl flex-col items-end gap-2">
                    <div className="flex max-w-full items-start gap-3">
                      <div className="min-w-0 rounded-lg bg-surface-highest p-4 shadow-sm">
                        <p className="whitespace-pre-wrap break-words text-base">{m.text}</p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground">{user ? initials(user.email, user.nom, user.prenom) : "IN"}</div>
                    </div>
                    {m.images.length > 0 && (
                      <div className="flex max-w-full flex-wrap justify-end gap-2 pr-12">
                        {m.images.map((image) => (
                          <a key={image.id} href={image.src} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-line bg-surface-lowest p-2 shadow-sm">
                            <img src={image.src} alt={image.text} className="h-20 w-20 rounded-md object-cover" />
                            <span className="max-w-40 truncate text-xs font-medium text-on-variant">{image.text}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mr-auto flex w-full max-w-4xl items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                      <Icon name="smart_toy" className="text-[22px]" />
                    </div>
                    <div className="min-w-0 w-full">
                      {m.status && !m.error && !m.verification && (
                        <p role="status" className="rounded-2xl rounded-tl-none border border-slate-line bg-surface-lowest p-4 text-base leading-7 text-on-variant shadow-sm sm:p-5">{m.status}</p>
                      )}
                      {m.error && (
                        <div role="alert" className="rounded-2xl rounded-tl-none border border-destructive/30 bg-destructive/5 p-4 shadow-sm sm:p-5">
                          <p className="flex items-center gap-2 text-base font-semibold text-destructive">
                            <Icon name="error" className="text-[20px]" />
                            La vérification n’a pas abouti
                          </p>
                          <p className="mt-2 text-base leading-7 text-foreground">{m.error}</p>
                        </div>
                      )}
                      {m.verification && (
                        <div className="flex w-full flex-col gap-3">
                          <VerificationSummary report={m.verification} />
                          <VerificationReport
                            report={m.verification}
                            onCopy={copy}
                            onShare={share}
                            copied={copied}
                          />
                        </div>
                      )}
                      {!m.status && !m.error && !m.verification && (
                        <p className="rounded-2xl rounded-tl-none border border-slate-line bg-surface-lowest p-4 text-base leading-7 text-on-variant shadow-sm sm:p-5">Demande envoyée. En attente du résultat…</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {actionMessage && <p role="status" className="ml-12 text-xs text-outline">{actionMessage}</p>}
            </section>
          </div>

          <div className={`app-composer fixed bottom-0 right-0 z-30 px-4 pb-5 pt-4 transition-[left] duration-300 motion-reduce:transition-none ${sidebarOpen ? "left-0 md:left-72" : "left-0"}`}>
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2">
              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 rounded-full bg-surface-lowest px-3 py-1 text-[13px] font-semibold shadow-sm">
                      <img src={c.src} alt="Image jointe" className="h-8 w-8 rounded object-cover" />
                      <span className="max-w-[200px] truncate">{c.text}</span>
                      <Button variant="ghost" aria-label={`Retirer ${c.text}`} onClick={() => { setChips((cs) => cs.filter((x) => x.id !== c.id)); setSelectedFile(null); }} className="flex items-center hover:text-destructive">
                        <Icon name="close" className="text-[16px]" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" onClick={() => { setChips([]); setSelectedFile(null); }} className="text-[12px] font-semibold text-outline hover:text-foreground">
                    Effacer les pièces jointes
                  </Button>
                </div>
              )}
              {showImageUrl && chips.length === 0 && !selectedFile && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    attachUrl();
                  }}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-line/80 bg-surface-lowest p-4 shadow-lg shadow-foreground/5 sm:flex-row sm:items-end"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <label htmlFor="image-url" className="text-sm font-semibold">Ajouter une image avec un lien</label>
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-line bg-surface px-3 transition-colors focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/5">
                      <Icon name="link" className="shrink-0 text-[18px] text-outline" />
                      <input
                        id="image-url"
                        type="url"
                        inputMode="url"
                        autoComplete="url"
                        value={imageUrlInput}
                        onChange={(event) => {
                          setImageUrlInput(event.target.value);
                          setAttachmentError("");
                        }}
                        placeholder="https://exemple.com/image.jpg"
                        aria-describedby="image-url-help"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-outline"
                        disabled={validatingImage || isSubmitting}
                      />
                    </div>
                    <span id="image-url-help" className="text-xs text-on-variant">Le lien doit être public et mener directement à une image.</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowImageUrl(false);
                        setImageUrlInput("");
                        setAttachmentError("");
                      }}
                      disabled={validatingImage}
                      className="rounded-xl"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={!imageUrlInput.trim() || validatingImage || isSubmitting} className="rounded-xl">
                      <Icon name={validatingImage ? "hourglass_top" : "visibility"} className="text-[18px]" />
                      {validatingImage ? "Validation…" : "Prévisualiser"}
                    </Button>
                  </div>
                </form>
              )}
              <div className="relative flex flex-col rounded-3xl border border-slate-line/80 bg-surface-lowest p-2.5 shadow-xl shadow-foreground/5 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                  }}
                  aria-label="Rumeur ou texte à vérifier"
                  placeholder="Décrivez la rumeur associée à cette image…"
                  className="w-full resize-none bg-transparent px-4 pb-2 pt-3 text-base placeholder:text-outline focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-1">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" className={toolBtn} aria-label="Téléverser une image" title="Téléverser une image (PNG, JPG, WEBP)" onClick={() => fileRef.current?.click()} disabled={chips.length > 0 || Boolean(selectedFile) || validatingImage || isSubmitting}>
                      <Icon name="attach_file" className="text-[20px]" />
                      <span className="hidden text-xs font-medium sm:inline">Image</span>
                    </Button>
                    <Button variant="ghost"
                      className={toolBtn}
                      title="Joindre une image par URL"
                      aria-label="Joindre une image par URL"
                      onClick={() => {
                        setShowImageUrl((shown) => !shown);
                        setAttachmentError("");
                      }}
                      disabled={validatingImage || chips.length > 0 || Boolean(selectedFile) || isSubmitting}
                    >
                      <Icon name="link" className="text-[20px]" />
                      <span className="hidden text-xs font-medium sm:inline">Lien</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-outline sm:inline">Image et texte requis</span>
                    <Button variant="ghost" onClick={submit} disabled={!canSend || isSubmitting} aria-label={isSubmitting ? "Vérification en cours" : "Envoyer la vérification"} title={isSubmitting ? "Vérification en cours" : "Envoyer"} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-lg active:translate-y-0 disabled:bg-surface-high disabled:text-outline disabled:shadow-none">
                      <Icon name={isSubmitting ? "hourglass_top" : "arrow_upward"} className="text-[20px]" />
                    </Button>
                  </div>
                </div>
              </div>
              <p aria-live="polite" className={`min-h-4 text-center text-xs ${attachmentError ? "text-destructive" : "text-outline"}`}>
                {attachmentError || (isSubmitting ? "Vérification en cours…" : validatingImage ? "Validation de l’image…" : !chips.length ? "Joignez une image (fichier ou URL) et saisissez un texte pour envoyer." : !input.trim() ? "Image jointe. Ajoutez la rumeur ou le texte à vérifier." : "Image et texte prêts à envoyer.")}
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (!isImageFile(f) || !["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
                  setAttachmentError("Le fichier doit être une image PNG, JPG ou WEBP.");
                } else if (f.size === 0 || f.size > 10 * 1024 * 1024) {
                  setAttachmentError("L’image doit peser entre 1 octet et 10 Mo.");
                } else {
                  setSelectedFile(f);
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result !== "string" || !addChip("image", f.name, reader.result)) setSelectedFile(null);
                  };
                  reader.onerror = () => {
                    setSelectedFile(null);
                    setAttachmentError("Impossible de lire cette image. Essayez un autre fichier.");
                  };
                  reader.readAsDataURL(f);
                }
              }
              e.target.value = "";
            }}
          />
        </main>
      </div>
    </div>
  );
}
