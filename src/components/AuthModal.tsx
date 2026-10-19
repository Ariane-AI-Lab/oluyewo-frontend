import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AuthModal({ initialMode, onClose }: { initialMode: "signin" | "signup"; onClose: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setInfo("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
      else onClose();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setError(error.message);
      else if (data.session) onClose();
      else setInfo("Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.");
    }
    setBusy(false);
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
          <input type="password" required minLength={6} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={field} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}
          <Button type="submit" disabled={busy} className="h-11 rounded-xl text-[15px] font-semibold">
            {busy ? "Patientez…" : mode === "signin" ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-on-variant">
          {mode === "signin" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
          <button className="font-semibold text-primary hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}>
            {mode === "signin" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
        <button onClick={onClose} className="mt-3 w-full text-center text-sm text-outline hover:text-foreground">Continuer en tant qu'invité</button>
      </div>
    </div>
  );
}
