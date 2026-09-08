import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Building2 } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { Thumb } from "@/components/Thumb";
import { VideoCard } from "@/components/VideoCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getVideo, updateVideoProgress } from "@/services/videoService";
import { createFeedback } from "@/services/feedbackService";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { relative } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/aluno/video/$id")({
  component: VideoPage,
});

function VideoPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: video } = useQuery({ queryKey: ["video", id], queryFn: () => getVideo(id) });

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const lastReported = useRef(0);

  useEffect(() => {
    if (video) lastReported.current = video.progress;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  const progressMutation = useMutation({
    mutationFn: (progress: number) => updateVideoProgress(id, progress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-aluno"] }),
  });

  const feedbackMutation = useMutation({
    mutationFn: () => createFeedback({ videoId: id, rating, comment: comment || "Sem comentário" }),
    onSuccess: () => {
      setOpen(false);
      setComment("");
      toast.success("Obrigado pelo feedback!");
      queryClient.invalidateQueries({ queryKey: ["video", id] });
    },
  });

  function reportProgress(progress: number) {
    const rounded = Math.round(progress);
    if (rounded <= lastReported.current) return;
    lastReported.current = rounded;
    progressMutation.mutate(rounded);
    if (rounded >= 100) setOpen(true);
  }

  function markCompleted() {
    lastReported.current = 100;
    progressMutation.mutate(100);
    setOpen(true);
  }

  if (!video) return null;

  const progress = video.progress;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-black">
          {video.source === "youtube" && video.youtube_id ? (
            <iframe
              className="aspect-video w-full"
              src={youtubeEmbedUrl(video.youtube_id)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : video.source === "upload" && video.file_url ? (
            <video
              className="aspect-video w-full"
              src={video.file_url}
              controls
              poster={video.thumbnail_url ?? undefined}
              onLoadedMetadata={(e) => {
                const el = e.currentTarget;
                if (progress > 0 && progress < 100) el.currentTime = (progress / 100) * el.duration;
              }}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration > 0) reportProgress((el.currentTime / el.duration) * 100);
              }}
              onEnded={() => reportProgress(100)}
            />
          ) : (
            <Thumb
              tag={video.tags[0] ?? "Processos"}
              className="aspect-video"
              label={video.title}
              imageUrl={video.thumbnail_url}
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {video.tags.map((t) => (
              <Badge key={t} variant="secondary" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="font-display text-2xl font-semibold">{video.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{video.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <StarRating value={Number(video.rating)} />
            <span>
              {Number(video.rating).toFixed(1)} ({video.ratings_count} avaliações)
            </span>
            <span>· {video.views} visualizações</span>
            <span>· publicado {relative(video.published_at)}</span>
          </div>
          <Button onClick={markCompleted} variant={progress >= 100 ? "secondary" : "default"}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {progress >= 100 ? "Aula concluída — avaliar de novo" : "Marcar como concluído"}
          </Button>
        </div>

        {video.feedbacks && video.feedbacks.length > 0 && (
          <Card className="gap-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              O que os alunos acharam
            </p>
            {video.feedbacks.map((f) => (
              <div key={f.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{f.user_name}</span>
                  <StarRating value={f.rating} />
                </div>
                <p className="text-xs text-muted-foreground">{f.comment}</p>
              </div>
            ))}
          </Card>
        )}

        {video.related && video.related.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Aulas relacionadas</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {video.related.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-4">
        {video.company && (
          <Card className="gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">
                {video.company.logo}
              </span>
              <div>
                <p className="text-sm font-medium">{video.company.name}</p>
                <p className="text-[11px] text-muted-foreground">{video.company.field}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{video.company.description}</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/aluno/empresa/$id" params={{ id: video.company.id }}>
                <Building2 className="mr-1.5 h-3.5 w-3.5" /> Ver a empresa
              </Link>
            </Button>
          </Card>
        )}
      </aside>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como foi essa aula?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte o que funcionou (opcional)"
              className="min-h-24"
            />
            <Button
              className="w-full"
              disabled={feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate()}
            >
              Enviar avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
