import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Check, Clock, MessageSquare, Star, Users } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Thumb } from "@/components/Thumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listCompanies } from "@/services/companyService";
import { listPlans } from "@/services/planService";
import { listTags } from "@/services/tagService";
import { listVideos } from "@/services/videoService";
import { publicContent } from "@/services/lpService";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BRAND } from "@/types";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const painIcons = [BarChart3, Users, MessageSquare, Clock];

interface HeroContent {
  headline: string;
  subheadline: string;
  cta_text: string;
}
interface BeneficiosContent {
  title: string;
  items: Array<{ title: string; description: string }>;
}
interface DepoimentosContent {
  title: string;
  items: Array<{ nome: string; empresa: string; frase: string }>;
}
interface PlanosContent {
  title: string;
  subtitle: string;
}
interface FaqContent {
  title: string;
  items: Array<{ pergunta: string; resposta: string }>;
}
interface FooterContent {
  text: string;
  email: string;
}

function LandingPage() {
  const { data: sections = [] } = useQuery({ queryKey: ["lp-content"], queryFn: publicContent });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: listTags });
  const { data: videosPage } = useQuery({
    queryKey: ["videos-preview"],
    queryFn: () => listVideos({ perPage: 6, sort: "recentes" }),
  });
  const preview = videosPage?.data ?? [];

  const hero = sections.find((s) => s.section_key === "hero")?.content as HeroContent | undefined;
  const beneficios = sections.find((s) => s.section_key === "beneficios")?.content as
    BeneficiosContent | undefined;
  const depoimentos = sections.find((s) => s.section_key === "depoimentos")?.content as
    DepoimentosContent | undefined;
  const planosSection = sections.find((s) => s.section_key === "planos")?.content as
    PlanosContent | undefined;
  const faq = sections.find((s) => s.section_key === "faq")?.content as FaqContent | undefined;
  const footer = sections.find((s) => s.section_key === "footer")?.content as
    FooterContent | undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="surface-ink sticky top-0 z-30 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <span className="font-display text-base font-semibold text-ink-foreground">
            {BRAND.name}
          </span>
          <nav className="hidden items-center gap-6 text-sm text-ink-muted md:flex">
            <a href="#beneficios" className="hover:text-ink-foreground">
              Benefícios
            </a>
            <a href="#conteudo" className="hover:text-ink-foreground">
              Conteúdo
            </a>
            <a href="#planos" className="hover:text-ink-foreground">
              Planos
            </a>
            <a href="#faq" className="hover:text-ink-foreground">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
            >
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/checkout" search={{ plan: "trimestral" }}>
                Assinar agora
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="surface-ink relative overflow-hidden">
        <div className="bg-grid-faint pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <Badge className="bg-white/10 font-normal text-ink-foreground hover:bg-white/10">
              +420 donos de negócio já dentro
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-ink-foreground md:text-5xl">
              {hero?.headline ?? "Pare de tocar seu negócio no improviso"}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              {hero?.subheadline ??
                "Mentoria prática em finanças, vendas, marketing, processos, pessoas e liderança."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/checkout" search={{ plan: "trimestral" }}>
                  {hero?.cta_text ?? "Começar agora"}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
              >
                <a href="#conteudo">Ver o conteúdo</a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Empreendedora acompanhando os indicadores do próprio negócio no computador"
              width={1280}
              height={960}
              className="w-full rounded-2xl object-cover shadow-lift ring-1 ring-white/10"
            />
            <Card className="absolute -bottom-6 -left-4 hidden w-56 gap-1 p-4 shadow-lift md:block">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Progresso da trilha
              </p>
              <p className="font-display text-lg font-semibold">Financeiro · 78%</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-1.5 w-[78%] rounded-full bg-primary" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="beneficios" className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Por que existe
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold">
            {beneficios?.title ?? "Os problemas que a gente resolve não são teóricos"}
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(beneficios?.items ?? []).map((p, i) => {
            const Icon = painIcons[i % painIcons.length]!;
            return (
              <Card key={p.title} className="gap-3 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-display text-base font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge
              key={t.id}
              variant="outline"
              className="rounded-full px-3 py-1 text-xs font-normal"
            >
              {t.name}
            </Badge>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-semibold">
            {depoimentos?.title ?? "Quem já está aplicando"}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(depoimentos?.items ?? []).map((t) => (
              <Card key={t.nome} className="gap-4 p-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">"{t.frase}"</p>
                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                    {t.nome
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{t.empresa}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <p className="mt-12 text-xs uppercase tracking-widest text-muted-foreground">
            Conteúdo produzido com empresas parceiras
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {companies.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded bg-foreground text-[10px] font-semibold text-background">
                  {c.logo}
                </span>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="conteudo" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl font-semibold">Uma amostra do que tem lá dentro</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Novas aulas toda semana, organizadas em trilhas por tema.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((v) => (
            <Card key={v.id} className="gap-0 overflow-hidden p-0">
              <Thumb
                tag={v.tags[0] ?? "Processos"}
                duration={v.duration}
                className="aspect-video"
                imageUrl={v.thumbnail_url}
              />
              <div className="space-y-2 p-4">
                <h3 className="font-display text-sm font-semibold">{v.title}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="planos" className="border-y border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold">
              {planosSection?.title ?? "Escolha seu plano"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {planosSection?.subtitle ?? "Sem fidelidade, sem letra miúda."}
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <Card
                key={p.id}
                className={cn(
                  "relative gap-5 p-7",
                  p.highlight && "border-primary shadow-lift ring-1 ring-primary/30",
                )}
              >
                {p.highlight && <Badge className="absolute -top-3 left-7">Mais popular</Badge>}
                <div>
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <p className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-semibold">
                      {brl(Number(p.price))}
                    </span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    equivale a {brl(Number(p.monthly_equivalent))} por mês
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-auto w-full"
                  variant={p.highlight ? "default" : "outline"}
                  size="lg"
                >
                  <Link to="/checkout" search={{ plan: p.id }}>
                    Assinar {p.name}
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="font-display text-3xl font-semibold">
          {faq?.title ?? "Perguntas frequentes"}
        </h2>
        <Accordion type="single" collapsible className="mt-6">
          {(faq?.items ?? []).map((item) => (
            <AccordionItem key={item.pergunta} value={item.pergunta}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {item.pergunta}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.resposta}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="surface-ink relative overflow-hidden">
        <div className="bg-grid-faint pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-3xl font-semibold text-ink-foreground md:text-4xl">
            Sua próxima decisão difícil pode ter um método
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">
            Comece hoje pela trilha que mais dói no seu negócio. Em uma semana você já tem algo
            aplicado.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/checkout" search={{ plan: "trimestral" }}>
              Assinar agora
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display font-semibold text-foreground">{BRAND.name}</p>
            <p className="text-xs">{footer?.text ?? BRAND.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs">
            <Link to="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <a href="#planos" className="hover:text-foreground">
              Planos
            </a>
            <span>{footer?.email}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
