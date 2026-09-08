import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Upload, Youtube } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { Thumb } from "@/components/Thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FilterBar, type FilterConfig, type FilterValue } from "@/components/filters/FilterBar";
import { Pager } from "@/components/Pager";
import { listCompanies } from "@/services/companyService";
import { listTags } from "@/services/tagService";
import {
  createVideo,
  listVideos,
  updateVideoTags,
  uploadVideoFile,
  uploadVideoThumbnail,
} from "@/services/videoService";
import { extractYoutubeId, youtubeThumbnailUrl } from "@/lib/youtube";
import { relative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mentor/conteudo")({
  component: Conteudo,
});

function Conteudo() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("15");
  const [tags, setTags] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [source, setSource] = useState<"youtube" | "upload">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [filters]);

  const { data: allTags = [] } = useQuery({ queryKey: ["tags"], queryFn: listTags });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const { data } = useQuery({
    queryKey: ["videos", "mentor", filters, page],
    queryFn: () =>
      listVideos({
        q: (filters.q as string) || undefined,
        tags: filters.tags ? (filters.tags as string[]).join(",") : undefined,
        companyId: (filters.companyId as string) || undefined,
        publishedFrom: (filters.publishedFrom as string) || undefined,
        publishedTo: (filters.publishedTo as string) || undefined,
        page,
        perPage: 9,
      }),
  });
  const videos = data?.data ?? [];

  const youtubeId = source === "youtube" ? extractYoutubeId(youtubeUrl) : null;

  function resetForm() {
    setTitle("");
    setDescription("");
    setDuration("15");
    setTags([]);
    setCompanyId("");
    setSource("youtube");
    setYoutubeUrl("");
    setVideoFile(null);
    setThumbnailFile(null);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      setSubmitting(true);
      try {
        const base = {
          title,
          description: description || "Aula publicada pelo mentor.",
          duration: Number(duration) || 15,
          companyId: companyId || undefined,
          tags,
        };

        if (source === "youtube") {
          if (!youtubeId) throw new Error("Link do YouTube inválido.");
          return await createVideo({ ...base, source: "youtube", youtubeUrl });
        }

        if (!videoFile) throw new Error("Selecione o arquivo de vídeo.");
        const fileUrl = await uploadVideoFile(videoFile);
        const thumbnailUrl = thumbnailFile ? await uploadVideoThumbnail(thumbnailFile) : undefined;
        return await createVideo({ ...base, source: "upload", fileUrl, thumbnailUrl });
      } finally {
        setSubmitting(false);
      }
    },
    onSuccess: () => {
      setOpen(false);
      resetForm();
      toast.success("Aula publicada!");
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível publicar a aula.");
    },
  });

  const tagsMutation = useMutation({
    mutationFn: ({ id, nextTags }: { id: string; nextTags: string[] }) =>
      updateVideoTags(id, nextTags),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videos"] }),
  });

  const canSubmit =
    title.trim().length > 0 &&
    tags.length > 0 &&
    (source === "youtube" ? Boolean(youtubeId) : Boolean(videoFile));

  const filterConfig: FilterConfig[] = [
    { key: "q", type: "search", label: "Busca", placeholder: "Buscar por título…" },
    {
      key: "companyId",
      type: "select",
      label: "Empresa",
      options: companies.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      key: "tags",
      type: "multiselect",
      label: "Tema",
      options: allTags.map((t) => ({ value: t.name, label: t.name })),
    },
    { key: "published", type: "dateRange", label: "Data de publicação" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Conteúdo</h1>
          <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} aulas publicadas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Nova aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Publicar nova aula</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Fluxo de caixa em 20 minutos"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                {source === "youtube" && (
                  <p className="text-[11px] text-muted-foreground">
                    A duração não é detectada automaticamente pelo link — confira e ajuste aqui.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Vídeo</Label>
                <Tabs value={source} onValueChange={(v) => setSource(v as "youtube" | "upload")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="youtube" className="flex-1">
                      <Youtube className="mr-1.5 h-3.5 w-3.5" /> Link do YouTube
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex-1">
                      <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload de arquivo
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="youtube" className="mt-3 space-y-2">
                    <Input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {youtubeUrl && !youtubeId && (
                      <p className="text-xs text-destructive">Link do YouTube inválido.</p>
                    )}
                    {youtubeId && (
                      <img
                        src={youtubeThumbnailUrl(youtubeId)}
                        alt="Capa do vídeo"
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Arquivo de vídeo (mp4)
                      </Label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Capa (opcional)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-1.5">
                <Label>Temas</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setTags((p) =>
                          p.includes(t.name) ? p.filter((x) => x !== t.name) : [...p, t.name],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        tags.includes(t.name)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Empresa parceira</Label>
                <div className="flex flex-wrap gap-2">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCompanyId(c.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        companyId === c.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!canSubmit || submitting}
                onClick={() => createMutation.mutate()}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar aula
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters((v) => ({ ...v, [key]: value }))}
        onClear={() => setFilters({})}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((v) => (
          <Card key={v.id} className="gap-3 overflow-hidden p-0">
            <Thumb
              tag={v.tags[0] ?? "Processos"}
              className="aspect-video"
              label={v.title}
              imageUrl={v.thumbnail_url}
            />
            <div className="space-y-2 p-4">
              <p className="text-sm font-medium">{v.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StarRating value={Number(v.rating)} /> {Number(v.rating).toFixed(1)} · {v.views}{" "}
                views · {relative(v.published_at)}
              </div>
              <p className="text-xs text-muted-foreground">{v.company_name}</p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => {
                  const on = v.tags.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      onClick={() =>
                        tagsMutation.mutate({
                          id: v.id,
                          nextTags: on ? v.tags.filter((x) => x !== t.name) : [...v.tags, t.name],
                        })
                      }
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="font-normal">
                  {v.duration} min
                </Badge>
                <Badge variant="outline" className="font-normal capitalize">
                  {v.source ?? "sem vídeo"}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Pager
        page={data?.meta.page ?? 1}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
