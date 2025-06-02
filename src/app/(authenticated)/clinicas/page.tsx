'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  Instagram,
  Globe,
  Mail,
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Clinic {
  id: string;
  nome: string;
  localizacao?: string | null;
  mediaDeMedicos?: number | null;
  instagram?: string | null;
  site?: string | null;
  linkBio?: string | null;
  contato?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  observacoes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClinicFormData {
  nome: string;
  localizacao?: string;
  mediaDeMedicos?: number;
  instagram?: string;
  site?: string;
  linkBio?: string;
  contato?: string;
  email?: string;
  whatsapp?: string;
  observacoes?: string;
}

export default function ClinicasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClinic, setCurrentClinic] = useState<ClinicFormData>({
    nome: '',
  });
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    fetchClinics();
  }, [currentPage, searchTerm]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/clinics?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setClinics(data.clinics);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      } else {
        toast.error('Erro ao carregar clínicas');
      }
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      toast.error('Erro ao carregar clínicas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setIsEditMode(false);
    setCurrentClinic({ nome: '' });
    setEditingClinicId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (clinic: Clinic) => {
    setIsEditMode(true);
    setCurrentClinic({
      nome: clinic.nome,
      localizacao: clinic.localizacao || '',
      mediaDeMedicos: clinic.mediaDeMedicos || undefined,
      instagram: clinic.instagram || '',
      site: clinic.site || '',
      linkBio: clinic.linkBio || '',
      contato: clinic.contato || '',
      email: clinic.email || '',
      whatsapp: clinic.whatsapp || '',
      observacoes: clinic.observacoes || '',
    });
    setEditingClinicId(clinic.id);
    setIsDialogOpen(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'mediaDeMedicos') {
      setCurrentClinic(prev => ({ 
        ...prev, 
        [name]: value ? parseInt(value) : undefined
      }));
    } else {
      setCurrentClinic(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentClinic.nome.trim()) {
      toast.error('Nome da clínica é obrigatório');
      return;
    }

    try {
      setSubmitting(true);
      
      const url = isEditMode ? `/api/clinics/${editingClinicId}` : '/api/clinics';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentClinic),
      });

      if (response.ok) {
        toast.success(isEditMode ? 'Clínica atualizada com sucesso!' : 'Clínica criada com sucesso!');
        setIsDialogOpen(false);
        fetchClinics();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar clínica');
      }
    } catch (error) {
      console.error('Erro ao salvar clínica:', error);
      toast.error('Erro ao salvar clínica');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clinic: Clinic) => {
    if (!confirm(`Tem certeza que deseja excluir a clínica "${clinic.nome}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clinics/${clinic.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Clínica excluída com sucesso!');
        fetchClinics();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir clínica');
      }
    } catch (error) {
      console.error('Erro ao excluir clínica:', error);
      toast.error('Erro ao excluir clínica');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/clinicas?page=${page}`);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pb-24 lg:pb-16 lg:ml-52 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-0 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] pt-20 lg:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Gestão de Clínicas</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie todas as clínicas do seu sistema</p>
          </div>
          
          <Button onClick={handleOpenNew} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nova Clínica
          </Button>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-3 px-3 sm:px-6">
            {/* Search Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar clínicas..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{totalItems}</span> clínicas
                </span>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : clinics.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhuma clínica encontrada' : 'Nenhuma clínica cadastrada'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca'
                    : 'Comece criando sua primeira clínica'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={handleOpenNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Clínica
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Médicos</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Redes Sociais</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clinics.map((clinic) => (
                        <TableRow key={clinic.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{clinic.nome}</div>
                              {clinic.contato && (
                                <div className="text-sm text-gray-500">{clinic.contato}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {clinic.localizacao ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{clinic.localizacao}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {clinic.mediaDeMedicos ? (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{clinic.mediaDeMedicos}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {clinic.email && (
                                <a 
                                  href={`mailto:${clinic.email}`}
                                  className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                                >
                                  <Mail className="h-3 w-3" />
                                  {clinic.email}
                                </a>
                              )}
                              {clinic.whatsapp && (
                                <a 
                                  href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                                >
                                  <Phone className="h-3 w-3" />
                                  {clinic.whatsapp}
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {clinic.instagram && (
                                <a 
                                  href={`https://instagram.com/${clinic.instagram}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-pink-600 hover:text-pink-700"
                                >
                                  <Instagram className="h-4 w-4" />
                                </a>
                              )}
                              {clinic.site && (
                                <a 
                                  href={clinic.site}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Globe className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(clinic)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(clinic)}
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

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {clinics.map((clinic) => (
                    <Card key={clinic.id} className="bg-white border border-gray-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold text-gray-900 truncate">
                              {clinic.nome}
                            </CardTitle>
                            {clinic.contato && (
                              <p className="text-sm text-gray-500 mt-1">{clinic.contato}</p>
                            )}
                            {clinic.localizacao && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{clinic.localizacao}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(clinic)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(clinic)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {/* Info Row */}
                        {clinic.mediaDeMedicos && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span>{clinic.mediaDeMedicos} médicos</span>
                          </div>
                        )}
                        
                        {/* Contact Info */}
                        <div className="space-y-2">
                          {clinic.email && (
                            <a 
                              href={`mailto:${clinic.email}`}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{clinic.email}</span>
                            </a>
                          )}
                          
                          {clinic.whatsapp && (
                            <a 
                              href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-green-600 hover:underline"
                            >
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{clinic.whatsapp}</span>
                            </a>
                          )}
                        </div>
                        
                        {/* Social Links */}
                        {(clinic.instagram || clinic.site) && (
                          <div className="flex gap-3 pt-2 border-t border-gray-100">
                            {clinic.instagram && (
                              <a 
                                href={`https://instagram.com/${clinic.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-pink-600 hover:underline"
                              >
                                <Instagram className="h-4 w-4" />
                                <span>@{clinic.instagram}</span>
                              </a>
                            )}
                            
                            {clinic.site && (
                              <a 
                                href={clinic.site}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                              >
                                <Globe className="h-4 w-4" />
                                <span>Site</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* Observations */}
                        {clinic.observacoes && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {clinic.observacoes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} clínicas
                </div>
                <div className="flex gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for Add/Edit Clinic */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Clínica' : 'Nova Clínica'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome da Clínica *</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={currentClinic.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome da clínica"
                />
              </div>
              
              <div>
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  name="localizacao"
                  value={currentClinic.localizacao || ''}
                  onChange={handleChange}
                  placeholder="Cidade, Estado"
                />
              </div>
              
              <div>
                <Label htmlFor="mediaDeMedicos">Número de Médicos</Label>
                <Input
                  id="mediaDeMedicos"
                  name="mediaDeMedicos"
                  type="number"
                  value={currentClinic.mediaDeMedicos || ''}
                  onChange={handleChange}
                  placeholder="Ex: 5"
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={currentClinic.email || ''}
                  onChange={handleChange}
                  placeholder="contato@clinica.com"
                />
              </div>
              
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={currentClinic.whatsapp || ''}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  value={currentClinic.instagram || ''}
                  onChange={handleChange}
                  placeholder="usuario_instagram"
                />
              </div>
              
              <div>
                <Label htmlFor="contato">Contato</Label>
                <Input
                  id="contato"
                  name="contato"
                  value={currentClinic.contato || ''}
                  onChange={handleChange}
                  placeholder="Nome do responsável"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="site">Site</Label>
                <Input
                  id="site"
                  name="site"
                  value={currentClinic.site || ''}
                  onChange={handleChange}
                  placeholder="https://www.clinica.com"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="linkBio">Link na Bio</Label>
                <Input
                  id="linkBio"
                  name="linkBio"
                  value={currentClinic.linkBio || ''}
                  onChange={handleChange}
                  placeholder="Link especial para bio"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={currentClinic.observacoes || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observações adicionais sobre a clínica"
                />
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  isEditMode ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 