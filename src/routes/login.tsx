import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, Lock, Mail } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { BRAND } from "@/types";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const highlights = [
  "Mentoria prática em grupo e trilhas guiadas por tema",
  "Comunidade de donos de negócio trocando o que funciona",
  "Teia de contatos para abrir portas dentro do clube",
];

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate({ to: user.role === "aluno" ? "/aluno" : "/mentor" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="surface-ink relative hidden overflow-hidden lg:block">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="bg-grid-faint pointer-events-none absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/30" />

        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-sm font-semibold text-primary-foreground">
              {BRAND.name[0]}
            </span>
            <span className="font-display text-lg font-semibold text-ink-foreground">
              {BRAND.name}
            </span>
          </Link>

          <div className="max-w-md space-y-5">
            <Badge className="bg-white/10 font-normal text-ink-foreground hover:bg-white/10">
              +420 donos de negócio já dentro
            </Badge>
            <p className="font-display text-3xl font-semibold leading-tight text-ink-foreground">
              {BRAND.tagline}
            </p>
            <ul className="space-y-2.5">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-sm font-semibold text-primary-foreground">
              {BRAND.name[0]}
            </span>
            <span className="font-display text-lg font-semibold">{BRAND.name}</span>
          </Link>

          <div className="mb-7">
            <h1 className="font-display text-2xl font-semibold">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com sua conta para continuar.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <PasswordInput
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
