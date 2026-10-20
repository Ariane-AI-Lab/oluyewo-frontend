import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { canSubmitVerification, isImageFile } from "@/lib/submission";
import { AuthModal } from "@/components/AuthModal";
import { initials, loadHistory, loadUser, mockLogin, mockLogout, saveHistory, type Investigation, type MockUser } from "@/lib/mock-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oluyẹwo — Nouvelle vérification" },
      { name: "description", content: "Vérifiez une rumeur, une image ou un document avec Oluyẹwo." },
      { property: "og:title", content: "Oluyẹwo — Nouvelle vérification" },
      { property: "og:description", content: "Vérifiez une rumeur, une image ou un document avec Oluyẹwo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LOGO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBasNotHjVmXZTXaidrQyrHgu0yxUFAsF_D5ps17ySqNOxticNKG3iX_hdu89kXoXrZH3RnvFi19GWrWmzwWSo5LqFnkPNRVDhfPtK6C-bkJrlDFiU3qskShZX7u1cZtYT_TCDY6U1rW-PM3yPhdb4-8ImetVQsFTQVeolSCgiFAcAZnucMIx3N6EUHVHLIHqCLvxF_mhU7RqQYMYipMeR8xv-TX_cLFjuDwJuRCmxvAr5rhhY6X7aylR51G8VSRWBfCw";
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

type Chip = { id: number; type: "image" | "link"; text: string; src: string };
type Message = { text: string; images: Chip[] };

function Index() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [history, setHistory] = useState<Investigation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExample, setShowExample] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [validatingImage, setValidatingImage] = useState(false);
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = loadUser();
    if (u) { setUser(u); setHistory(loadHistory(u.email)); }
  }, []);

  const addChip = (type: Chip["type"], text: string, src: string) => {
    setChips((c) => [...c, { id: Date.now() + Math.random(), type, text, src }]);
    setAttachmentError("");
  };
  const canSend = canSubmitVerification(input, chips.length) && !validatingImage;
  const reset = () => {
    setSent([]); setInput(""); setChips([]); setCurrentId(null); setShowExample(false); setAttachmentError("");
  };
  const attachUrl = () => {
    const value = prompt("Collez l’URL publique d’une image :", "https://");
    if (!value) return;
    let url: URL;
    try {
      url = new URL(value.trim());
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
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      setAttachmentError("Cette URL ne charge pas une image accessible. Téléversez l’image ou essayez une autre URL.");
      setValidatingImage(false);
    };
    image.src = url.href;
  };

  const submit = () => {
    if (!canSend) return;
    const next = [...sent, { text: input.trim(), images: [...chips] }];
    setSent(next);
    setShowExample(false);
    setInput("");
    setChips([]);
    if (user) {
      const id = currentId ?? `inv-${Date.now().toString(36)}`;
      const existing = history.find((h) => h.id === id);
      const item: Investigation = { id, title: existing?.title ?? (next[0]?.text ?? "Enquête").slice(0, 60), messages: next, updatedAt: Date.now() };
      const list = [item, ...history.filter((h) => h.id !== id)];
      setHistory(list);
      setCurrentId(id);
      saveHistory(user.email, list);
    }
  };

  const openInvestigation = (h: Investigation) => {
    setCurrentId(h.id); setSent(h.messages); setShowExample(false); setInput(""); setChips([]); setAttachmentError("");
  };
  const login = (email: string) => {
    const u = mockLogin(email);
    setUser(u); setHistory(loadHistory(u.email)); setAuthMode(null);
  };
  const logout = () => {
    mockLogout(); setUser(null); setHistory([]); reset();
  };

  const copy = () => {
    navigator.clipboard
      .writeText(
        "[VERDICT OLUYẸWO]\nStatut: CONTEXTE DÉTOURNÉ / RUMEUR INFONDÉE\nSujet: Concours recrutement direct douanes béninoises.\nSource officielle: Aucun arrêté au JORB, démenti formel DG Douanes (douanes.gouv.bj).",
      )
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  };

  const share = () => {
    const msg = encodeURIComponent(
      "⚠️ ATTENTION FAUSSE INFORMATION DÉTECTÉE PAR OLUYẸWO ⚠️\n\nLe document circulant sur un recrutement immédiat aux douanes béninoises est un FAUX (signatures 2021 détournées).",
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
  };

  const actionBtn = "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-on-variant transition-colors hover:bg-surface-low hover:text-foreground";
  const toolBtn = "rounded-lg p-2 text-on-variant transition-colors hover:bg-surface-low hover:text-primary";

  return (
    <div className="min-h-screen bg-surface font-sans text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-line bg-surface px-4">
        <Button variant="ghost" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "Réduire le menu" : "Ouvrir le menu"} aria-expanded={sidebarOpen} aria-controls="verification-sidebar" title={sidebarOpen ? "Réduire le menu" : "Ouvrir le menu"} className="h-11 gap-3 px-2">
          <Icon name={sidebarOpen ? "menu_open" : "menu"} className="text-[24px] text-on-variant" />
          <img src={LOGO} alt="Oluyẹwo" className="h-8 max-w-[180px] object-contain" />
        </Button>
        {!user && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setAuthMode("signin")} className="text-sm font-semibold text-on-variant">Se connecter</Button>
            <Button onClick={() => setAuthMode("signup")} className="hidden rounded-lg text-sm font-semibold sm:inline-flex">Créer un compte</Button>
          </div>
        )}
      </header>
      <aside id="verification-sidebar" inert={!sidebarOpen} className={`fixed bottom-0 left-0 top-16 z-40 overflow-hidden border-r border-slate-line bg-surface-low px-0 py-6 transition-[width,transform] duration-300 motion-reduce:transition-none ${sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full border-r-0"}`}>
        <div className="flex w-72 flex-col gap-6 px-2">
          <div className="px-2 pt-3">
            <Button variant="ghost"
              onClick={reset}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-semibold tracking-wide text-primary-foreground shadow-sm transition-all hover:bg-primary-container"
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
                    className={`justify-start truncate rounded-lg px-3 py-3 text-left text-base transition-colors ${currentId === h.id ? "bg-surface-highest text-foreground" : "text-on-variant hover:bg-surface-high hover:text-foreground"}`}>
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
          <div className="absolute inset-x-0 bottom-0 w-72 border-t border-slate-line bg-surface-low p-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">{initials(user.email)}</div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.email}</span>
              <Button variant="ghost" onClick={logout} title="Se déconnecter" aria-label="Se déconnecter" className="h-9 px-2 text-on-variant hover:text-destructive">
                <Icon name="logout" className="text-[20px]" />
              </Button>
            </div>
          </div>
        )}
      </aside>
      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} onLogin={login} />}

      <div className={`transition-[padding] duration-300 motion-reduce:transition-none ${sidebarOpen ? "md:pl-72" : "pl-0"}`}>
        <main className="relative w-full pt-16">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-6 py-6 pb-64">
            <section className="flex flex-col gap-6">
              {!showExample && sent.length === 0 && (
                <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 py-16 text-center sm:py-24">
                  <Icon name="smart_toy" className="text-[40px] text-primary" />
                  <h1 className="text-3xl font-semibold">Bienvenue sur Oluyẹwo</h1>
                  <p className="max-w-md text-base leading-relaxed text-on-variant">Joignez une image et décrivez la rumeur ou le texte à vérifier. Les deux sont obligatoires pour envoyer votre demande.</p>
                  <div className="flex flex-wrap justify-center gap-5 text-sm text-on-variant">
                    <span className="inline-flex items-center gap-2"><Icon name="image" className="text-[18px] text-primary" />Image : fichier ou URL</span>
                    <span className="inline-flex items-center gap-2"><Icon name="notes" className="text-[18px] text-primary" />Rumeur / texte</span>
                    <button onClick={() => setShowExample(true)} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"><Icon name="visibility" className="text-[18px]" />Voir un exemple</button>
                  </div>
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground shadow-sm">{user ? initials(user.email) : "IN"}</div>
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
                    <Button variant="ghost" onClick={copy} className={actionBtn}>
                      <Icon name={copied ? "check" : "content_copy"} className="text-[18px]" />
                      {copied ? "Copié !" : "Copier"}
                    </Button>
                    <Button variant="ghost" onClick={share} className={actionBtn}>
                      <Icon name="share" className="text-[18px]" />
                      Diffuser
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
                <div key={i} className="flex flex-col gap-6">
                  <div className="ml-auto flex max-w-3xl items-start gap-3">
                    <div className="min-w-0 rounded-lg bg-surface-highest p-4 shadow-sm">
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <div className="mt-3 flex flex-wrap gap-2">{m.images.map((image) => <a key={image.id} href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.text} className="h-24 w-24 rounded-md border border-slate-line object-cover" /></a>)}</div>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground">{user ? initials(user.email) : "IN"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                      <Icon name="smart_toy" className="text-[22px]" />
                    </div>
                    <p className="text-on-variant">Demande reçue avec votre image et votre texte. La vérification automatique n’est pas encore connectée.</p>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div className={`fixed bottom-0 right-0 z-30 bg-surface px-4 pb-6 pt-4 transition-[left] duration-300 motion-reduce:transition-none ${sidebarOpen ? "left-0 md:left-72" : "left-0"}`}>
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2">
              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 rounded-full bg-surface-lowest px-3 py-1 text-[13px] font-semibold shadow-sm">
                      <img src={c.src} alt="Image jointe" className="h-8 w-8 rounded object-cover" />
                      <span className="max-w-[200px] truncate">{c.text}</span>
                      <Button variant="ghost" aria-label={`Retirer ${c.text}`} onClick={() => setChips((cs) => cs.filter((x) => x.id !== c.id))} className="flex items-center hover:text-destructive">
                        <Icon name="close" className="text-[16px]" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" onClick={() => setChips([])} className="text-[12px] font-semibold text-outline hover:text-foreground">
                    Effacer les pièces jointes
                  </Button>
                </div>
              )}
              <div className="relative flex flex-col rounded-2xl border border-slate-line bg-surface-lowest p-2 shadow-lg transition-all focus-within:border-primary focus-within:shadow-sm">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                  }}
                  aria-label="Rumeur ou texte à vérifier"
                  placeholder="Décrivez la rumeur ou le texte à vérifier…"
                  className="w-full resize-none bg-transparent px-3 pb-1 pt-2 text-[15px] placeholder:text-outline focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-1">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" className={toolBtn} aria-label="Téléverser une image" title="Téléverser une image (PNG, JPG)" onClick={() => fileRef.current?.click()}>
                      <Icon name="attach_file" className="text-[20px]" />
                    </Button>
                    <Button variant="ghost"
                      className={toolBtn}
                      title="Joindre une image par URL"
                      aria-label="Joindre une image par URL"
                      onClick={attachUrl}
                      disabled={validatingImage}
                    >
                      <Icon name="link" className="text-[20px]" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-[11px] font-semibold text-outline sm:inline">Image + texte requis</span>
                    <Button variant="ghost" onClick={submit} disabled={!canSend} aria-label="Envoyer" title="Envoyer" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary active:scale-95">
                      <Icon name="arrow_upward" className="text-[18px]" />
                    </Button>
                  </div>
                </div>
              </div>
              <p aria-live="polite" className={`min-h-4 text-center text-xs ${attachmentError ? "text-destructive" : "text-outline"}`}>
                {attachmentError || (validatingImage ? "Validation de l’image…" : !chips.length ? "Joignez une image (fichier ou URL) et saisissez un texte pour envoyer." : !input.trim() ? "Image jointe. Ajoutez la rumeur ou le texte à vérifier." : "Image et texte prêts à envoyer.")}
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (!isImageFile(f)) {
                  setAttachmentError("Veuillez choisir un fichier image.");
                } else {
                  const reader = new FileReader();
                  reader.onload = () => { if (typeof reader.result === "string") addChip("image", f.name, reader.result); };
                  reader.onerror = () => setAttachmentError("Impossible de lire cette image. Essayez un autre fichier.");
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
