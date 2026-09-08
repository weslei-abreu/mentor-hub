import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Thumb } from "@/components/Thumb";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Video } from "@/types";

export function VideoCard({ video }: { video: Video }) {
  const progress = video.progress;
  return (
    <Link
      to="/aluno/video/$id"
      params={{ id: video.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <Thumb
        tag={video.tags[0] ?? "Processos"}
        duration={video.duration}
        className="aspect-video"
        imageUrl={video.thumbnail_url}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-sm font-semibold leading-snug text-card-foreground group-hover:text-primary">
          {video.title}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{video.description}</p>
        <div className="mt-auto space-y-2 pt-2">
          <div className="flex flex-wrap gap-1">
            {video.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                {t}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate">{video.company_name}</span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {Number(video.rating).toFixed(1)}
            </span>
          </div>
          {progress > 0 && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1" />
              <p className="text-[10px] text-muted-foreground">
                {progress >= 100 ? "Concluído" : `${progress}% assistido`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
