import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { initials, loadHistory, loadUser, mockLogout, type MockUser } from "@/lib/mock-auth";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Mon compte — Oluyẹwo" },
      { name: "description", content: "Consultez votre compte Oluyẹwo et vos enquêtes enregistrées." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [investigationCount, setInvestigationCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const account = loadUser();
    setUser(account);
    setInvestigationCount(account ? loadHistory(account.email).length : 0);
  }, []);

  const logout = () => {
    mockLogout();
    setUser(null);
    setInvestigationCount(0);
    void navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between border-b border-slate-line pb-4">
          <Link to="/" className="text-lg font-bold text-primary">Oluyẹwo</Link>
          <Link to="/" className="text-sm font-semibold text-on-variant hover:text-primary">Retour aux vérifications</Link>
        </header>

        <section className="rounded-2xl border border-slate-line bg-surface-lowest p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {user ? initials(user.email, user.nom, user.prenom) : "?"}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {user ? [user.prenom, user.nom].filter(Boolean).join(" ") || "Mon compte" : "Mon compte"}
              </h1>
              <p className="mt-1 text-sm text-on-variant">
                {user ? "Compte connecté" : "Aucun compte connecté"}
              </p>
            </div>
          </div>

          {user ? (
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {(user.prenom || user.nom) && (
                <div className="rounded-xl bg-surface-low p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-outline">Nom complet</dt>
                  <dd className="mt-2 text-base font-medium">{[user.prenom, user.nom].filter(Boolean).join(" ")}</dd>
                </div>
              )}
              <div className="rounded-xl bg-surface-low p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-outline">Adresse e-mail</dt>
                <dd className="mt-2 break-all text-base font-medium">{user.email}</dd>
              </div>
              <div className="rounded-xl bg-surface-low p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-outline">Enquêtes enregistrées</dt>
                <dd className="mt-2 text-base font-medium">{investigationCount}</dd>
              </div>
              <p className="text-sm leading-6 text-on-variant sm:col-span-2">
                La connexion et l’historique sont enregistrés localement sur cet appareil.
              </p>
            </dl>
          ) : (
            <div className="mt-8 rounded-xl bg-surface-low p-4">
              <p className="text-sm leading-6 text-on-variant">
                Connectez-vous depuis l’accueil pour enregistrer vos enquêtes et consulter votre historique.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Button variant="destructive" onClick={logout} className="rounded-lg">
                Se déconnecter
              </Button>
            ) : (
              <Button asChild className="rounded-lg">
                <Link to="/">Aller à l’accueil</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
