import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";

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
    className="mx-1 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-chip px-2 py-0.5 align-middle text-[12px] font-medium text-primary transition-colors hover:bg-primary-container/20"
  >
    <Icon name={icon} className="text-[13px]" />
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

const recent = ["Déclaration Électorale Cotonou", "Subventions Agricoles 2024", "Inauguration CHU Calavi"];

type Chip = { id: number; type: "image" | "link"; text: string };

function Index() {
  const [active, setActive] = useState(0);
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addChip = (type: Chip["type"], text: string) => setChips((c) => [...c, { id: Date.now(), type, text }]);

  const submit = () => {
    if (!input.trim()) {
      alert("Veuillez saisir une information ou joindre un document à analyser.");
      return;
    }
    setSent((s) => [...s, input.trim()]);
    setInput("");
    setChips([]);
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
      <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col justify-between bg-surface-low px-2 py-6 shadow-[0_1px_8px_oklch(0_0_0/0.04)]">
        <div className="flex flex-col gap-6">
          <div className="px-2 pt-3">
            <button
              onClick={() => { setSent([]); setInput(""); setChips([]); }}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_1px_8px_oklch(0.69_0.17_155/0.2)] transition-all hover:bg-primary-container"
            >
              <Icon name="add" className="text-[20px]" />
              Nouvelle vérification
            </button>
          </div>
          <div className="flex flex-col gap-2 px-2">
            <span className="px-2 text-sm font-semibold uppercase tracking-wider text-outline">Enquêtes Récentes</span>
            <nav className="flex flex-col gap-2">
              {recent.map((r, i) => (
                <button
                  key={r}
                  onClick={() => setActive(i)}
                  className={`truncate rounded-lg px-3 py-3 text-left text-base transition-colors ${
                    active === i ? "bg-surface-highest text-foreground" : "text-on-variant hover:bg-surface-high hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="px-2">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-on-variant transition-colors hover:bg-surface-high hover:text-foreground">
            <Icon name="settings" className="text-[20px]" />
            Paramètres
          </button>
        </div>
      </aside>

      <div className="pl-72">
        <header className="fixed left-72 right-0 top-0 z-40 h-16 bg-surface/80 shadow-[0_1px_8px_oklch(0_0_0/0.04)] backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <img src={LOGO} alt="Oluyẹwo Logo" className="h-8 w-auto object-contain" />
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 rounded-full bg-surface-low px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
              </div>
              <button aria-label="Notifications" className="p-2 text-on-variant hover:text-foreground">
                <Icon name="notifications" className="text-[22px]" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">EC</div>
            </div>
          </div>
        </header>

        <main className="relative w-full pt-16">
          <div className="h-11 bg-surface-low px-6 shadow-sm" />
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-6 py-6 pb-64">
            <section className="flex flex-col gap-6">
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground shadow-sm">EC</div>
              </div>

              <div className="mr-auto flex w-full max-w-4xl items-start gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                  <Icon name="policy" className="text-[22px]" />
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
                    <button onClick={copy} className={actionBtn}>
                      <Icon name={copied ? "check" : "content_copy"} className="text-[18px]" />
                      {copied ? "Copié !" : "Copier"}
                    </button>
                    <button onClick={share} className={actionBtn}>
                      <Icon name="share" className="text-[18px]" />
                      Diffuser
                    </button>
                    <div className="mx-1 h-4 w-px bg-slate-line" />
                    <button onClick={() => setVote("up")} title="Réponse utile" className={`rounded-lg p-1.5 hover:bg-surface-low hover:text-primary ${vote === "up" ? "text-primary" : "text-on-variant"}`}>
                      <Icon name="thumb_up" className="text-[18px]" />
                    </button>
                    <button onClick={() => setVote("down")} title="Réponse inexacte" className={`rounded-lg p-1.5 hover:bg-surface-low hover:text-destructive ${vote === "down" ? "text-destructive" : "text-on-variant"}`}>
                      <Icon name="thumb_down" className="text-[18px]" />
                    </button>
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

              {sent.map((m, i) => (
                <div key={i} className="flex flex-col gap-6">
                  <div className="ml-auto flex max-w-3xl items-start gap-3">
                    <div className="rounded-2xl rounded-tr-none bg-surface-highest p-6 shadow-sm">{m}</div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground">EC</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                      <Icon name="policy" className="text-[22px]" />
                    </div>
                    <p className="text-on-variant">Enquête lancée. Le croisement JORB / Médias d'État est en cours…</p>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div className="fixed bottom-0 left-72 right-0 z-40 bg-gradient-to-t from-surface via-surface/95 to-transparent px-6 pb-6 pt-6">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2">
              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 rounded-full bg-surface-lowest px-3 py-1 text-[13px] font-semibold shadow-sm">
                      <Icon name={c.type} className="text-[16px] text-primary" />
                      <span className="max-w-[200px] truncate">{c.text}</span>
                      <button onClick={() => setChips((cs) => cs.filter((x) => x.id !== c.id))} className="flex items-center hover:text-destructive">
                        <Icon name="close" className="text-[16px]" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setChips([])} className="text-[12px] font-semibold text-outline hover:text-foreground">
                    Effacer les pièces jointes
                  </button>
                </div>
              )}
              <div className="relative flex flex-col rounded-2xl border border-slate-line bg-surface-lowest p-2 shadow-lg transition-all focus-within:border-primary focus-within:shadow-[0_4px_20px_oklch(0.69_0.17_155/0.14)]">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                  }}
                  placeholder="Poser une question ou vérifier une rumeur..."
                  className="w-full resize-none bg-transparent px-3 pb-1 pt-2 text-[15px] placeholder:text-outline focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-1">
                  <div className="flex items-center gap-1">
                    <button className={toolBtn} title="Téléverser une image (PNG, JPG)" onClick={() => fileRef.current?.click()}>
                      <Icon name="attach_file" className="text-[20px]" />
                    </button>
                    <button
                      className={toolBtn}
                      title="Coller le lien d'une image ou page web"
                      onClick={() => {
                        const url = prompt("Veuillez saisir l'URL publique de l'image ou du document à inspecter :", "https://");
                        if (url && url !== "https://") addChip("link", url);
                      }}
                    >
                      <Icon name="link" className="text-[20px]" />
                    </button>
                    <button
                      className={toolBtn}
                      title="Vérification vocale (Audio WhatsApp)"
                      onClick={() => alert("Module audio activé : Oluyẹwo transcrit et traduit le Fon, le Yoruba, le Mina et le Français.")}
                    >
                      <Icon name="mic" className="text-[20px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-[11px] font-semibold text-outline sm:inline">Entrée pour envoyer</span>
                    <button onClick={submit} title="Lancer la vérification" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary active:scale-95">
                      <Icon name="arrow_upward" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addChip("image", `${f.name} (Téléversé)`);
              e.target.value = "";
            }}
          />
        </main>
      </div>
    </div>
  );
}
