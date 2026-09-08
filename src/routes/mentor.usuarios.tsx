import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Plus, UserX, UserCheck } from "lucide-react";
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
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { createUser, listUsers, resetUserPassword, updateUser } from "@/services/userService";
import { dateBR } from "@/lib/format";
import type { Role } from "@/types";

export const Route = createFileRoute("/mentor/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "aluno" as Role,
    business: "",
  });
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPassword, setResetPasswordValue] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [filters]);

  const { data } = useQuery({
    queryKey: ["users", filters, page],
    queryFn: () =>
      listUsers({
        role: (filters.role as Role) || undefined,
        status: (filters.status as "ativo" | "inativo") || undefined,
        q: (filters.q as string) || undefined,
        createdFrom: (filters.createdFrom as string) || undefined,
        createdTo: (filters.createdTo as string) || undefined,
        page,
        perPage: 5,
      }),
  });
  const users = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: () => {
      toast.success("Usuário criado");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "aluno", business: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ativo" | "inativo" }) =>
      updateUser(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetUserPassword(resetTarget!, resetPassword),
    onSuccess: () => {
      toast.success("Senha redefinida");
      setResetTarget(null);
      setResetPasswordValue("");
    },
  });

  const filterConfig: FilterConfig[] = [
    { key: "q", type: "search", label: "Busca", placeholder: "Nome ou e-mail…" },
    {
      key: "role",
      type: "select",
      label: "Perfil",
      options: [
        { value: "admin", label: "Admin" },
        { value: "mentor", label: "Mentor" },
        { value: "aluno", label: "Aluno" },
      ],
    },
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "ativo", label: "Ativo" },
        { value: "inativo", label: "Inativo" },
      ],
    },
    { key: "created", type: "dateRange", label: "Data de criação" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {data?.meta.total ?? 0} usuários cadastrados
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Senha inicial</Label>
                <PasswordInput
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluno">Aluno</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role === "aluno" && (
                <div className="space-y-1.5">
                  <Label>Negócio</Label>
                  <Input
                    value={form.business}
                    onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))}
                  />
                </div>
              )}
              <Button
                className="w-full"
                disabled={
                  !form.name || !form.email || form.password.length < 6 || createMutation.isPending
                }
                onClick={() => createMutation.mutate()}
              >
                Criar usuário
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

      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="hidden md:table-cell">Criado em</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span className="font-medium">{u.name}</span>
                  <span className="block text-xs text-muted-foreground">{u.email}</span>
                </TableCell>
                <TableCell className="capitalize">{u.role}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {dateBR(u.created_at)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.status === "ativo" ? "success" : "destructive"}
                    className="capitalize"
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Redefinir senha"
                      onClick={() => setResetTarget(u.id)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title={u.status === "ativo" ? "Desativar" : "Ativar"}
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: u.id,
                          status: u.status === "ativo" ? "inativo" : "ativo",
                        })
                      }
                    >
                      {u.status === "ativo" ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pager
        page={data?.meta.page ?? 1}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
      />

      <Dialog open={!!resetTarget} onOpenChange={(v) => !v && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <PasswordInput
                value={resetPassword}
                onChange={(e) => setResetPasswordValue(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={resetPassword.length < 6}
              onClick={() => resetMutation.mutate()}
            >
              Salvar nova senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
