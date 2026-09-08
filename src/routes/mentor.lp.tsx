import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminContent,
  deleteMedia,
  moveSection,
  updateSection,
  uploadMedia,
} from "@/services/lpService";
import type { LpSection } from "@/types";

export const Route = createFileRoute("/mentor/lp")({
  component: LpEditorPage,
});

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  beneficios: "Benefícios",
  depoimentos: "Depoimentos",
  planos: "Planos",
  faq: "Perguntas frequentes",
  footer: "Rodapé",
};

function LpEditorPage() {
  const queryClient = useQueryClient();
  const { data: sections = [] } = useQuery({
    queryKey: ["lp-admin-content"],
    queryFn: adminContent,
  });

  const moveMutation = useMutation({
    mutationFn: ({ sectionKey, direction }: { sectionKey: string; direction: "up" | "down" }) =>
      moveSection(sectionKey, direction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lp-admin-content"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Editor da landing page</h1>
        <p className="text-sm text-muted-foreground">
          Edite os textos e a ordem das seções da LP pública.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <SectionEditor
            key={section.section_key}
            section={section}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            onMove={(direction) =>
              moveMutation.mutate({ sectionKey: section.section_key, direction })
            }
          />
        ))}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  isFirst,
  isLast,
  onMove,
}: {
  section: LpSection;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
}) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<Record<string, unknown>>(section.content);

  useEffect(() => setContent(section.content), [section.content]);

  const saveMutation = useMutation({
    mutationFn: () => updateSection(section.section_key, content, section.active),
    onSuccess: () => {
      toast.success("Seção salva");
      queryClient.invalidateQueries({ queryKey: ["lp-admin-content"] });
      queryClient.invalidateQueries({ queryKey: ["lp-content"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadMedia(section.section_key, file),
    onSuccess: () => {
      toast.success("Imagem enviada");
      queryClient.invalidateQueries({ queryKey: ["lp-admin-content"] });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lp-admin-content"] }),
  });

  function setField(key: string, value: unknown) {
    setContent((c) => ({ ...c, [key]: value }));
  }

  function setItem(index: number, field: string, value: string) {
    const items = [...((content.items as Array<Record<string, string>>) ?? [])];
    items[index] = { ...items[index], [field]: value };
    setField("items", items);
  }

  function addItem(template: Record<string, string>) {
    setField("items", [...((content.items as Array<Record<string, string>>) ?? []), template]);
  }

  function removeItem(index: number) {
    const items = [...((content.items as Array<Record<string, string>>) ?? [])];
    items.splice(index, 1);
    setField("items", items);
  }

  const items = (content.items as Array<Record<string, string>>) ?? [];

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold">
          {SECTION_LABELS[section.section_key] ?? section.section_key}
        </p>
        <div className="flex gap-1.5">
          <Button size="icon" variant="ghost" disabled={isFirst} onClick={() => onMove("up")}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" disabled={isLast} onClick={() => onMove("down")}>
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {section.section_key === "hero" && (
        <div className="space-y-3">
          <Field
            label="Título"
            value={content.headline as string}
            onChange={(v) => setField("headline", v)}
          />
          <Field
            label="Subtítulo"
            value={content.subheadline as string}
            onChange={(v) => setField("subheadline", v)}
            textarea
          />
          <Field
            label="Texto do botão"
            value={content.cta_text as string}
            onChange={(v) => setField("cta_text", v)}
          />
        </div>
      )}

      {section.section_key === "planos" && (
        <div className="space-y-3">
          <Field
            label="Título"
            value={content.title as string}
            onChange={(v) => setField("title", v)}
          />
          <Field
            label="Subtítulo"
            value={content.subtitle as string}
            onChange={(v) => setField("subtitle", v)}
          />
        </div>
      )}

      {section.section_key === "footer" && (
        <div className="space-y-3">
          <Field
            label="Texto"
            value={content.text as string}
            onChange={(v) => setField("text", v)}
          />
          <Field
            label="E-mail de contato"
            value={content.email as string}
            onChange={(v) => setField("email", v)}
          />
        </div>
      )}

      {section.section_key === "beneficios" && (
        <div className="space-y-3">
          <Field
            label="Título"
            value={content.title as string}
            onChange={(v) => setField("title", v)}
          />
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Item {i + 1}</span>
                <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Field
                label="Título"
                value={item.title ?? ""}
                onChange={(v) => setItem(i, "title", v)}
              />
              <Field
                label="Descrição"
                value={item.description ?? ""}
                onChange={(v) => setItem(i, "description", v)}
                textarea
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => addItem({ title: "", description: "" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar item
          </Button>
        </div>
      )}

      {section.section_key === "depoimentos" && (
        <div className="space-y-3">
          <Field
            label="Título"
            value={content.title as string}
            onChange={(v) => setField("title", v)}
          />
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Depoimento {i + 1}</span>
                <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Field label="Nome" value={item.nome ?? ""} onChange={(v) => setItem(i, "nome", v)} />
              <Field
                label="Empresa"
                value={item.empresa ?? ""}
                onChange={(v) => setItem(i, "empresa", v)}
              />
              <Field
                label="Frase"
                value={item.frase ?? ""}
                onChange={(v) => setItem(i, "frase", v)}
                textarea
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => addItem({ nome: "", empresa: "", frase: "" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar depoimento
          </Button>
        </div>
      )}

      {section.section_key === "faq" && (
        <div className="space-y-3">
          <Field
            label="Título"
            value={content.title as string}
            onChange={(v) => setField("title", v)}
          />
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pergunta {i + 1}</span>
                <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Field
                label="Pergunta"
                value={item.pergunta ?? ""}
                onChange={(v) => setItem(i, "pergunta", v)}
              />
              <Field
                label="Resposta"
                value={item.resposta ?? ""}
                onChange={(v) => setItem(i, "resposta", v)}
                textarea
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => addItem({ pergunta: "", resposta: "" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar pergunta
          </Button>
        </div>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">Imagens da seção</p>
        <div className="flex flex-wrap gap-2">
          {(section.media ?? []).map((m) => (
            <div key={m.id} className="relative">
              <img src={m.url} alt={m.alt ?? ""} className="h-16 w-16 rounded-md object-cover" />
              <button
                onClick={() => deleteMediaMutation.mutate(m.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:border-primary/40">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
            />
          </label>
        </div>
      </div>

      <Button
        className="w-fit"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        Salvar seção
      </Button>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-20"
        />
      ) : (
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
