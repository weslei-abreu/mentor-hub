import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar, type FilterConfig, type FilterValue } from "@/components/filters/FilterBar";
import { Pager } from "@/components/Pager";
import { ContactKanban } from "@/components/teia/ContactKanban";
import { adminListRequests, listContacts } from "@/services/teiaService";
import { dateBR } from "@/lib/format";

export const Route = createFileRoute("/mentor/teia")({
  component: TeiaAdminPage,
});

const fieldOptions = [
  "Contabilidade",
  "Marketing Digital",
  "Recursos Humanos",
  "Logística",
  "Tecnologia",
  "Jurídico",
  "Arquitetura",
  "Varejo",
].map((f) => ({ value: f, label: f }));

function TeiaAdminPage() {
  const [contactFilters, setContactFilters] = useState<Record<string, FilterValue>>({});
  const [requestFilters, setRequestFilters] = useState<Record<string, FilterValue>>({});
  const [requestPage, setRequestPage] = useState(1);

  useEffect(() => setRequestPage(1), [requestFilters]);

  const { data: contactsPage } = useQuery({
    queryKey: ["teia-contacts", "admin", contactFilters],
    queryFn: () =>
      listContacts({
        field: (contactFilters.field as string) || undefined,
        city: (contactFilters.city as string) || undefined,
        q: (contactFilters.q as string) || undefined,
        perPage: 200,
      }),
  });
  const contacts = contactsPage?.data ?? [];

  const { data } = useQuery({
    queryKey: ["teia-admin-requests", requestFilters, requestPage],
    queryFn: () =>
      adminListRequests({
        field: (requestFilters.field as string) || undefined,
        city: (requestFilters.city as string) || undefined,
        status: (requestFilters.status as "pendente" | "aprovado" | "recusado") || undefined,
        from: (requestFilters.dateFrom as string) || undefined,
        to: (requestFilters.dateTo as string) || undefined,
        page: requestPage,
        perPage: 20,
      }),
  });
  const requests = data?.data ?? [];

  const contactFilterConfig: FilterConfig[] = [
    { key: "q", type: "search", label: "Busca", placeholder: "Nome, empresa ou cidade…" },
    { key: "field", type: "select", label: "Ramo", options: fieldOptions },
  ];

  const requestFilterConfig: FilterConfig[] = [
    { key: "field", type: "select", label: "Ramo", options: fieldOptions },
    { key: "city", type: "search", label: "Cidade", placeholder: "Filtrar por cidade…" },
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "pendente", label: "Pendente" },
        { value: "aprovado", label: "Aprovado" },
        { value: "recusado", label: "Recusado" },
      ],
    },
    { key: "date", type: "dateRange", label: "Data da solicitação" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Teia — visão administrativa</h1>
          <p className="text-sm text-muted-foreground">
            {contactsPage?.meta.total ?? 0} contatos cadastrados · {data?.meta.total ?? 0}{" "}
            solicitações
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/mentor/teia/mapa">
            <Network className="mr-1.5 h-3.5 w-3.5" /> Ver em 3D
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="contatos">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="contatos">Contatos ({contactsPage?.meta.total ?? 0})</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações ({data?.meta.total ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="contatos" className="mt-5 space-y-4">
          <FilterBar
            filters={contactFilterConfig}
            values={contactFilters}
            onChange={(key, value) => setContactFilters((v) => ({ ...v, [key]: value }))}
            onClear={() => setContactFilters({})}
          />
          <ContactKanban contacts={contacts} />
        </TabsContent>

        <TabsContent value="solicitacoes" className="mt-5 space-y-4">
          <FilterBar
            filters={requestFilterConfig}
            values={requestFilters}
            onChange={(key, value) => setRequestFilters((v) => ({ ...v, [key]: value }))}
            onClear={() => setRequestFilters({})}
          />

          <Card className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead className="hidden md:table-cell">Ramo</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.contact_name}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {r.contact_field}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {r.contact_city}
                    </TableCell>
                    <TableCell className="text-sm">{r.requester_name}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {dateBR(r.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "aprovado"
                            ? "success"
                            : r.status === "recusado"
                              ? "destructive"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="p-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma solicitação encontrada com esses filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Pager
            page={data?.meta.page ?? 1}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setRequestPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
