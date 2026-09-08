import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Plus, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermissionMatrix, permissionSummary } from "@/components/staff/PermissionMatrix";
import {
  createStaff,
  deleteStaff,
  listStaff,
  resetStaffPassword,
  updateStaff,
  updateStaffPermissions,
  type StaffMember,
} from "@/services/staffService";
import { dateBR } from "@/lib/format";
import type { Module, ModulePermissions, PermissionMap } from "@/types";

export const Route = createFileRoute("/mentor/staff")({
  component: StaffPage,
});

const EMPTY_PERMISSIONS: PermissionMap = {};

function StaffPage() {
  const queryClient = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: listStaff });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    business: "",
  });
  const [createPermissions, setCreatePermissions] = useState<PermissionMap>(EMPTY_PERMISSIONS);

  const [permissionsTarget, setPermissionsTarget] = useState<StaffMember | null>(null);
  const [editPermissions, setEditPermissions] = useState<PermissionMap>(EMPTY_PERMISSIONS);

  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["staff"] });
  }

  const createMutation = useMutation({
    mutationFn: () => createStaff({ ...createForm, permissions: createPermissions }),
    onSuccess: () => {
      toast.success("Membro da equipe criado");
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", business: "" });
      setCreatePermissions(EMPTY_PERMISSIONS);
      invalidate();
    },
  });

  const permissionsMutation = useMutation({
    mutationFn: () => updateStaffPermissions(permissionsTarget!.id, editPermissions),
    onSuccess: () => {
      toast.success("Permissões atualizadas");
      setPermissionsTarget(null);
      invalidate();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ativo" | "inativo" }) =>
      updateStaff(id, { status }),
    onSuccess: invalidate,
  });

  const resetMutation = useMutation({
    mutationFn: () => resetStaffPassword(resetTarget!.id, resetPassword),
    onSuccess: () => {
      toast.success("Senha redefinida");
      setResetTarget(null);
      setResetPassword("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStaff(deleteTarget!.id),
    onSuccess: () => {
      toast.success("Membro da equipe removido");
      setDeleteTarget(null);
      invalidate();
    },
  });

  function openPermissions(member: StaffMember) {
    setPermissionsTarget(member);
    setEditPermissions(member.permissions);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            {staff.length} membro{staff.length === 1 ? "" : "s"} com acesso restrito por módulo
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Novo membro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar membro da equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Senha inicial</Label>
                <PasswordInput
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Área / cargo (opcional)</Label>
                <Input
                  placeholder="Ex.: Suporte, Financeiro…"
                  value={createForm.business}
                  onChange={(e) => setCreateForm((f) => ({ ...f, business: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Permissões por módulo</Label>
                <PermissionMatrix
                  value={createPermissions}
                  onChange={(module: Module, permissions: ModulePermissions) =>
                    setCreatePermissions((p) => ({ ...p, [module]: permissions }))
                  }
                />
              </div>
              <Button
                className="w-full"
                disabled={
                  !createForm.name ||
                  !createForm.email ||
                  createForm.password.length < 6 ||
                  createMutation.isPending
                }
                onClick={() => createMutation.mutate()}
              >
                Criar membro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Criado em</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <span className="font-medium">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">{s.email}</span>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {dateBR(s.created_at)}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => openPermissions(s)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {permissionSummary(s.permissions)}
                  </button>
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === "ativo" ? "success" : "destructive"}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Editar permissões"
                      onClick={() => openPermissions(s)}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Redefinir senha"
                      onClick={() => setResetTarget(s)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title={s.status === "ativo" ? "Desativar" : "Ativar"}
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: s.id,
                          status: s.status === "ativo" ? "inativo" : "ativo",
                        })
                      }
                    >
                      {s.status === "ativo" ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Remover"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum membro da equipe cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!permissionsTarget} onOpenChange={(v) => !v && setPermissionsTarget(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões de {permissionsTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <PermissionMatrix
              value={editPermissions}
              onChange={(module: Module, permissions: ModulePermissions) =>
                setEditPermissions((p) => ({ ...p, [module]: permissions }))
              }
            />
            <Button
              className="w-full"
              disabled={permissionsMutation.isPending}
              onClick={() => permissionsMutation.mutate()}
            >
              Salvar permissões
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(v) => !v && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha de {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <PasswordInput
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={resetPassword.length < 6 || resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              Salvar nova senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O acesso desse membro da equipe será revogado imediatamente. Essa ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
