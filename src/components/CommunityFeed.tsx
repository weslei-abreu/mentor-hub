import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pager } from "@/components/Pager";
import { addComment, createPost, listPosts, toggleLike } from "@/services/communityService";
import { listTags } from "@/services/tagService";
import { relative } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function CommunityFeed({ mentorView = false }: { mentorView?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<string>("todos");
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [filter, onlyUnanswered]);

  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: listTags });
  const { data: postsData } = useQuery({
    queryKey: ["posts", filter, onlyUnanswered, page],
    queryFn: () =>
      listPosts({
        tag: filter === "todos" ? undefined : filter,
        unanswered: onlyUnanswered || undefined,
        page,
        perPage: 6,
      }),
  });
  const posts = postsData?.data ?? [];

  const createPostMutation = useMutation({
    mutationFn: () => createPost({ text: text.trim(), tag }),
    onSuccess: () => {
      setText("");
      setTag(undefined);
      toast.success("Post publicado na comunidade");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => toggleLike(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, commentText }: { postId: string; commentText: string }) =>
      addComment(postId, commentText),
    onSuccess: (_data, variables) => {
      setDrafts((d) => ({ ...d, [variables.postId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const unanswered = posts.filter((p) => p.comments.length === 0).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {user ? initials(user.name) : "--"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mentorView
                    ? "Compartilhe um recado, provocação ou pergunta com a turma…"
                    : "O que você está aplicando no seu negócio essa semana?"
                }
                className="min-h-20 resize-none border-border/70"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Tema:</span>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTag(tag === t.name ? undefined : t.name)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                      tag === t.name
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {t.name}
                  </button>
                ))}
                <Button
                  size="sm"
                  className="ml-auto"
                  disabled={!text.trim() || createPostMutation.isPending}
                  onClick={() => createPostMutation.mutate()}
                >
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {posts.length === 0 && (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum post por aqui</p>
            <p className="text-xs text-muted-foreground">
              Ajuste os filtros ou seja o primeiro a publicar.
            </p>
          </Card>
        )}

        {posts.map((post) => (
          <Card key={post.id} className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted text-xs">
                  {initials(post.author_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{post.author_name}</span>
                  <span className="text-xs text-muted-foreground">{relative(post.created_at)}</span>
                  {post.tag_name && (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {post.tag_name}
                    </Badge>
                  )}
                  {mentorView && post.comments.length === 0 && (
                    <Badge className="bg-warning/15 text-[10px] font-normal text-warning-foreground hover:bg-warning/15">
                      sem resposta
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{post.text}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pl-12 text-xs text-muted-foreground">
              <button
                onClick={() => likeMutation.mutate(post.id)}
                className={cn(
                  "flex items-center gap-1.5 transition-colors hover:text-primary",
                  post.likedByMe && "text-primary",
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", post.likedByMe && "fill-primary")} />
                {post.likes_count}
              </button>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                {post.comments.length}
              </span>
            </div>

            {post.comments.length > 0 && (
              <div className="space-y-2 border-l-2 border-border pl-4 md:ml-12">
                {post.comments.map((c) => (
                  <div key={c.id} className="text-xs">
                    <span className="font-medium">{c.author_name}</span>{" "}
                    <span className="text-muted-foreground">{relative(c.created_at)}</span>
                    <p className="text-foreground/80">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 md:pl-12">
              <Input
                value={drafts[post.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [post.id]: e.target.value }))}
                placeholder={mentorView ? "Responder como mentor…" : "Escreva um comentário…"}
                className="h-9 text-sm"
                onKeyDown={(e) => {
                  const commentText = (drafts[post.id] ?? "").trim();
                  if (e.key === "Enter" && commentText) {
                    commentMutation.mutate({ postId: post.id, commentText });
                  }
                }}
              />
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 shrink-0"
                disabled={!(drafts[post.id] ?? "").trim()}
                onClick={() => {
                  const commentText = (drafts[post.id] ?? "").trim();
                  commentMutation.mutate({ postId: post.id, commentText });
                  toast.success("Comentário enviado");
                }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}

        <Pager
          page={postsData?.meta.page ?? 1}
          totalPages={postsData?.meta.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filtrar por tema
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["todos", ...tags.map((t) => t.name)].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  filter === t
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {t === "todos" ? "Todos" : t}
              </button>
            ))}
          </div>
        </Card>
        {mentorView && (
          <Card className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Engajamento
            </p>
            <p className="text-sm">
              <span className="font-display text-2xl font-semibold text-primary">{unanswered}</span>{" "}
              posts sem resposta
            </p>
            <Button
              size="sm"
              variant={onlyUnanswered ? "default" : "outline"}
              className="w-full"
              onClick={() => setOnlyUnanswered((v) => !v)}
            >
              {onlyUnanswered ? "Mostrando pendentes" : "Ver só sem resposta"}
            </Button>
          </Card>
        )}
      </aside>
    </div>
  );
}
