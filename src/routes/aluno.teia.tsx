import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, List, Network, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterBar, type FilterConfig, type FilterValue } from "@/components/filters/FilterBar";
import { Pager } from "@/components/Pager";
import { ContactKanban, ContactListItem } from "@/components/teia/ContactKanban";
import {
  createContact,
  createRequest,
  listContacts,
  myRequests,
  respondRequest,
} from "@/services/teiaService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno/teia")({
  component: TeiaPage,
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

function TeiaPage() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, FilterValue>>({});
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [newContact, setNewContact] = useState({
    name: "",
    companyName: "",
    field: "",
    city: "",
    phone: "",
    email: "",
  });
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [listPage, setListPage] = useState(1);

  useEffect(() => setListPage(1), [values, viewMode]);

  const { data } = useQuery({
    queryKey: ["teia-contacts", values],
    queryFn: () =>
      listContacts({
        field: (values.field as string) || undefined,
        city: (values.city as string) || undefined,
        status: (values.status as "liberado" | "bloqueado") || undefined,
        q: (values.q as string) || undefined,
        perPage: 100,
      }),
  });
  const contacts = data?.data ?? [];

  const LIST_PAGE_SIZE = 12;
  const listTotalPages = Math.max(1, Math.ceil(contacts.length / LIST_PAGE_SIZE));
  const pagedContacts = contacts.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  const { data: sent = [] } = useQuery({
    queryKey: ["teia-requests", "sent"],
    queryFn: () => myRequests("sent"),
  });
  const { data: received = [] } = useQuery({
    queryKey: ["teia-requests", "received"],
    queryFn: () => myRequests("received"),
  });

  const requestMutation = useMutation({
    mutationFn: (contactId: string) => createRequest(contactId),
    onSuccess: () => {
      toast.success("Solicitação enviada");
      queryClient.invalidateQueries({ queryKey: ["teia-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["teia-requests"] });
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "aprovado" | "recusado" }) =>
      respondRequest(id, status),
    onSuccess: () => {
      toast.success("Solicitação atualizada");
      queryClient.invalidateQueries({ queryKey: ["teia-requests"] });
    },
  });

  const createContactMutation = useMutation({
    mutationFn: () => createContact(newContact),
    onSuccess: () => {
      toast.success("Contato adicionado à sua teia");
      setNewContact({ name: "", companyName: "", field: "", city: "", phone: "", email: "" });
      setNewContactOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teia-contacts"] });
    },
  });

  const filters: FilterConfig[] = [
    { key: "q", type: "search", label: "Busca", placeholder: "Nome, empresa ou cidade…" },
    { key: "field", type: "select", label: "Ramo", options: fieldOptions },
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "liberado", label: "Contato liberado" },
        { value: "bloqueado", label: "Bloqueado" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Teia</h1>
          <p className="text-sm text-muted-foreground">
            A rede de contatos construída pelos membros do clube.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/aluno/teia/mapa">
              <Network className="mr-1.5 h-3.5 w-3.5" /> Ver em 3D
            </Link>
          </Button>
          <Dialog open={newContactOpen} onOpenChange={setNewContactOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo contato na sua teia</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  <Input
                    value={newContact.companyName}
                    onChange={(e) => setNewContact((c) => ({ ...c, companyName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Ramo</Label>
                    <Input
                      value={newContact.field}
                      onChange={(e) => setNewContact((c) => ({ ...c, field: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cidade</Label>
                    <Input
                      value={newContact.city}
                      onChange={(e) => setNewContact((c) => ({ ...c, city: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input
                      value={newContact.email}
                      onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!newContact.name.trim() || createContactMutation.isPending}
                  onClick={() => createContactMutation.mutate()}
                >
                  Salvar contato
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="todos">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="todos">Todos os contatos</TabsTrigger>
          <TabsTrigger value="enviadas">Minhas solicitações ({sent.length})</TabsTrigger>
          <TabsTrigger value="recebidas">Solicitações recebidas ({received.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterBar
              filters={filters}
              values={values}
              onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
              onClear={() => setValues({})}
            />
            <div className="flex shrink-0 gap-1 rounded-lg border border-border p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </button>
              <button
                onClick={() => setViewMode("lista")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "lista"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-3.5 w-3.5" /> Lista
              </button>
            </div>
          </div>

          {viewMode === "kanban" ? (
            <ContactKanban
              contacts={contacts}
              onRequest={(id) => requestMutation.mutate(id)}
              requestPending={requestMutation.isPending}
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedContacts.map((c) => (
                  <ContactListItem
                    key={c.id}
                    contact={c}
                    onRequest={(id) => requestMutation.mutate(id)}
                    requestPending={requestMutation.isPending}
                  />
                ))}
                {contacts.length === 0 && (
                  <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">
                    Nenhum contato encontrado com esses filtros.
                  </Card>
                )}
              </div>
              <Pager page={listPage} totalPages={listTotalPages} onPageChange={setListPage} />
            </>
          )}
        </TabsContent>

        <TabsContent value="enviadas" className="mt-5 space-y-3">
          {sent.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Você ainda não solicitou nenhuma apresentação.
            </p>
          )}
          {sent.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm font-medium">{r.contact_name}</p>
              <Badge
                variant={
                  r.status === "aprovado"
                    ? "success"
                    : r.status === "recusado"
                      ? "destructive"
                      : "secondary"
                }
              >
                {r.status}
              </Badge>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recebidas" className="mt-5 space-y-3">
          {received.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação recebida ainda.</p>
          )}
          {received.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">
                  {r.requester_name} quer conhecer {r.contact_name}
                </p>
                {r.message && <p className="text-xs text-muted-foreground">{r.message}</p>}
              </div>
              {r.status === "pendente" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondMutation.mutate({ id: r.id, status: "recusado" })}
                  >
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => respondMutation.mutate({ id: r.id, status: "aprovado" })}
                  >
                    Aprovar
                  </Button>
                </div>
              ) : (
                <Badge variant={r.status === "aprovado" ? "success" : "destructive"}>
                  {r.status}
                </Badge>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
