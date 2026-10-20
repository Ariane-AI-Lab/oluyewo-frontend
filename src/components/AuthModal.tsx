import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function AuthModal({ initialMode, onClose, onLogin }: { initialMode: "signin" | "signup"; onClose: () => void; onLogin: (email: string) => void }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(email);
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
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" />
          <input type="password" required placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={field} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          <Button type="submit" className="h-11 rounded-xl text-[15px] font-semibold">
            {mode === "signin" ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-on-variant">
          {mode === "signin" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
          <button className="font-semibold text-primary hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
        <button onClick={onClose} className="mt-3 w-full text-center text-sm text-outline hover:text-foreground">Continuer en mode invité</button>
      </div>
    </div>
  );
}
