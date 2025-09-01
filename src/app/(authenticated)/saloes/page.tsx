"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Building2,
  Plus,
  Search,
  Instagram,
  Globe,
  Mail,
  Phone,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";

interface Salon {
  id: string;
  nome: string;
  endereco?: string | null;
  instagram?: string | null;
  email?: string | null;
  telefone?: string | null;
  site?: string | null;
  numeroDeUnidades?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface SalonFormData {
  nome: string;
  endereco?: string;
  instagram?: string;
  email?: string;
  telefone?: string;
  site?: string;
  numeroDeUnidades?: number;
}

export default function SaloesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [current, setCurrent] = useState<SalonFormData>({ nome: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(parseInt(params.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetchSalons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });
      if (searchTerm) qs.set("search", searchTerm);
      const res = await fetch(`/api/salons?${qs.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar salões");
      const data = await res.json();
      setSalons(data.salons);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar salões");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setIsEditMode(false);
    setCurrent({ nome: "" });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (salon: Salon) => {
    setIsEditMode(true);
    setCurrent({
      nome: salon.nome,
      endereco: salon.endereco || "",
      instagram: salon.instagram || "",
      email: salon.email || "",
      telefone: salon.telefone || "",
      site: salon.site || "",
      numeroDeUnidades: salon.numeroDeUnidades || undefined,
    });
    setEditingId(salon.id);
    setIsDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "numeroDeUnidades") {
      setCurrent((prev) => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else {
      setCurrent((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (current.email && current.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(current.email.trim())) {
        toast.error("Por favor, insira um e-mail válido");
        return;
      }
    }

    try {
      setSubmitting(true);
      const url = isEditMode && editingId ? `/api/salons/${editingId}` : "/api/salons";
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 409) toast.error("Já existe um salão com este nome");
        else if (res.status === 400 && err.details) {
          const first = Object.values(err.details)[0] as any;
          if (first?._errors?.[0]) toast.error(first._errors[0]);
          else toast.error("Dados inválidos");
        } else toast.error(err.error || "Erro ao salvar salão");
        return;
      }
      toast.success(isEditMode ? "Salão atualizado" : "Salão criado");
      setIsDialogOpen(false);
      fetchSalons();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar salão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (salon: Salon) => {
    if (!confirm(`Tem certeza que deseja excluir o salão "${salon.nome}"?`)) return;
    try {
      const res = await fetch(`/api/salons/${salon.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erro ao excluir salão");
        return;
      }
      toast.success("Salão excluído");
      fetchSalons();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir salão");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/saloes?page=${page}`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-[100dvh] bg-gray-100 pb-24 lg:pb-16 lg:ml-52 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-0 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] pt-20 lg:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Gestão de Salões</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie todos os salões de beleza</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleOpenNew} className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Novo Salão
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-3 px-3 sm:px-6">
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar salões..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{totalItems}</span> salões
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : salons.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Nenhum salão encontrado" : "Nenhum salão cadastrado"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "Tente ajustar os termos de busca" : "Comece criando seu primeiro salão"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleOpenNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Salão
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Redes/Site</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salons.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium">{s.nome}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">{s.endereco || "-"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {s.email && (
                              <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                                <Mail className="h-3 w-3" />
                                {s.email}
                              </a>
                            )}
                            {s.telefone && (
                              <div className="flex items-center gap-1 text-green-700 text-sm">
                                <Phone className="h-3 w-3" />
                                {s.telefone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {s.instagram && (
                              <a
                                href={`https://instagram.com/${s.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 hover:text-pink-700"
                              >
                                <Instagram className="h-4 w-4" />
                              </a>
                            )}
                            {s.site && (
                              <a
                                href={s.site}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Globe className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.numeroDeUnidades ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(s)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(s)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Salão" : "Novo Salão"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input name="nome" value={current.nome} onChange={handleChange} placeholder="Ex.: Glam Studio" />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input name="email" value={current.email || ""} onChange={handleChange} placeholder="contato@exemplo.com" />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input name="endereco" value={current.endereco || ""} onChange={handleChange} placeholder="Rua..., nº..., bairro, cidade" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input name="telefone" value={current.telefone || ""} onChange={handleChange} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input name="instagram" value={current.instagram || ""} onChange={handleChange} placeholder="@perfil" />
              </div>
              <div>
                <Label>Site</Label>
                <Input name="site" value={current.site || ""} onChange={handleChange} placeholder="https://" />
              </div>
              <div>
                <Label>Nº de unidades</Label>
                <Input name="numeroDeUnidades" type="number" value={current.numeroDeUnidades ?? ""} onChange={handleChange} placeholder="Ex.: 3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditMode ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
