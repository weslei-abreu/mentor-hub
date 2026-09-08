import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { Card } from "@/components/ui/card";
import { FilterBar, type FilterConfig, type FilterValue } from "@/components/filters/FilterBar";
import { Pager } from "@/components/Pager";
import { listVideos } from "@/services/videoService";
import { listCompanies } from "@/services/companyService";
import { listTags } from "@/services/tagService";

export const Route = createFileRoute("/aluno/biblioteca")({
  component: Biblioteca,
});

function Biblioteca() {
  const [values, setValues] = useState<Record<string, FilterValue>>({ sort: "recentes" });
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [values]);

  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: listTags });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const tagList = (values.tags as string[]) ?? [];
  const { data } = useQuery({
    queryKey: ["videos", values, page],
    queryFn: () =>
      listVideos({
        q: (values.q as string) || undefined,
        tags: tagList.length > 0 ? tagList.join(",") : undefined,
        companyId: (values.companyId as string) || undefined,
        sort: (values.sort as "recentes" | "assistidos" | "avaliados") || "recentes",
        page,
        perPage: 8,
      }),
  });
  const videos = data?.data ?? [];

  const filters: FilterConfig[] = [
    { key: "q", type: "search", label: "Busca", placeholder: "Buscar por título ou assunto…" },
    {
      key: "companyId",
      type: "select",
      label: "Empresa",
      options: companies.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      key: "sort",
      type: "select",
      label: "Ordenar por",
      options: [
        { value: "recentes", label: "Mais recentes" },
        { value: "assistidos", label: "Mais assistidos" },
        { value: "avaliados", label: "Melhor avaliados" },
      ],
    },
    {
      key: "tags",
      type: "multiselect",
      label: "Tema",
      options: tags.map((t) => ({ value: t.name, label: t.name })),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} aulas disponíveis</p>
      </div>

      <FilterBar
        filters={filters}
        values={values}
        onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        onClear={() => setValues({ sort: "recentes" })}
      />

      {videos.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm font-medium">Nenhuma aula encontrada</p>
          <p className="text-xs text-muted-foreground">
            Tente outra busca ou remova alguns filtros.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
          <Pager
            page={data?.meta.page ?? 1}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
