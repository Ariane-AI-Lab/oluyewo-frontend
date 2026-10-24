import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type RegistrationDetails = { nom: string; prenom: string };

export function AuthModal({
  initialMode,
  onClose,
  onLogin,
}: {
  initialMode: "signin" | "signup";
  onClose: () => void;
  onLogin: (email: string, registration?: RegistrationDetails) => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && (!nom.trim() || !prenom.trim())) {
      setError("Le nom et le prénom sont obligatoires.");
      return;
    }
    setError("");
    onLogin(
      email,
      mode === "signup" ? { nom: nom.trim(), prenom: prenom.trim() } : undefined,
    );
  };

  const field = "w-full rounded-xl border border-slate-line bg-surface px-4 py-3 text-[15px] focus:border-primary focus:outline-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-7 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 text-on-variant hover:text-foreground">
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
        <h2 className="text-2xl font-semibold">{mode === "signin" ? "Se connecter" : "Créer un compte"}</h2>
        <p className="mt-1 text-sm text-on-variant">Enregistrez vos enquêtes et retrouvez votre historique.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <input
                type="text"
                required
                placeholder="Nom"
                value={nom}
                onChange={(e) => { setNom(e.target.value); setError(""); }}
                className={field}
                autoComplete="family-name"
              />
              <input
                type="text"
                required
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => { setPrenom(e.target.value); setError(""); }}
                className={field}
                autoComplete="given-name"
              />
            </>
          )}
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" />
          <input type="password" required placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={field} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 rounded-xl text-[15px] font-semibold">
            {mode === "signin" ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-on-variant">
          {mode === "signin" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
          <button className="font-semibold text-primary hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
            {mode === "signin" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
        <button onClick={onClose} className="mt-3 w-full text-center text-sm text-outline hover:text-foreground">Continuer en mode invité</button>
      </div>
    </div>
  );
}
