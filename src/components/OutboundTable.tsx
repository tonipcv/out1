"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Outbound, Clinic } from "@prisma/client";
import { PlusCircle, Pencil, Trash2, Building, Link, Mail, Phone, Instagram, User } from "lucide-react";

type OutboundTableProps = {
  initialOutbounds: Outbound[];
};

type OutboundWithClinics = Outbound & {
  clinics?: Clinic[];
  email?: string | null;
};

// Adicionando uma interface para a clínica com todas as propriedades
interface ClinicFormData {
  id?: string;
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

const statusOptions = [
  { value: "prospectado", label: "Prospectado" },
  { value: "abordado", label: "Abordado" },
  { value: "respondeu", label: "Respondeu" },
  { value: "interessado", label: "Interessado" },
  { value: "publicou link", label: "Publicou Link" },
  { value: "upgrade lead", label: "Upgrade Lead" }
];

const createGmailLink = (email: string, name: string) => {
  const subject = encodeURIComponent(`Contato - ${name}`);
  const body = encodeURIComponent(`Olá ${name},\n\n`);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
};

export default function OutboundTable({ initialOutbounds }: OutboundTableProps) {
  const router = useRouter();
  const [outbounds, setOutbounds] = useState<OutboundWithClinics[]>(initialOutbounds);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentOutbound, setCurrentOutbound] = useState<Partial<OutboundWithClinics>>({});
  const [loading, setLoading] = useState(false);
  
  // Estado para gerenciar clínicas vinculadas ao contato atual
  const [currentClinics, setCurrentClinics] = useState<ClinicFormData[]>([]);
  // Estado para a clínica que está sendo editada no momento
  const [currentClinic, setCurrentClinic] = useState<ClinicFormData>({
    nome: "",
  });
  // Estado para controlar a visibilidade do modal de clínica
  const [isClinicDialogOpen, setIsClinicDialogOpen] = useState(false);
  // Estado para controlar se estamos editando uma clínica existente
  const [editingClinicIndex, setEditingClinicIndex] = useState<number | null>(null);

  const handleOpenNew = () => {
    setIsEditMode(false);
    setCurrentOutbound({
      status: "prospectado",
      endereco: ""
    });
    setCurrentClinics([]);
    setIsOpen(true);
  };

  const handleOpenEdit = (outbound: OutboundWithClinics) => {
    setIsEditMode(true);
    setCurrentOutbound({ ...outbound });
    
    // Carregar clínicas associadas quando editar um contato
    fetchOutboundClinics(outbound.id);
    
    setIsOpen(true);
  };

  // Função para buscar clínicas associadas ao contato
  const fetchOutboundClinics = async (outboundId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/outbound/${outboundId}/clinics`);
      
      if (response.ok) {
        const clinics = await response.json();
        setCurrentClinics(clinics);
      } else {
        console.error('Erro ao buscar clínicas:', response.statusText);
        setCurrentClinics([]);
      }
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      setCurrentClinics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentOutbound((prev) => ({ ...prev, [name]: value }));
  };

  const handleClinicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Se for o campo mediaDeMedicos, converta para número
    if (name === 'mediaDeMedicos') {
      setCurrentClinic(prev => ({ 
        ...prev, 
        [name]: value ? parseInt(value) : undefined
      }));
    } else {
      setCurrentClinic(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddClinic = () => {
    // Resetar o formulário de clínica e abrir o modal
    setCurrentClinic({
      nome: ""
    });
    setEditingClinicIndex(null);
    setIsClinicDialogOpen(true);
  };

  const handleEditClinic = (index: number) => {
    // Carregar dados da clínica existente para edição
    setCurrentClinic(currentClinics[index]);
    setEditingClinicIndex(index);
    setIsClinicDialogOpen(true);
  };

  const handleDeleteClinic = (index: number) => {
    if (confirm('Tem certeza que deseja remover esta clínica?')) {
      // Remove a clínica da lista atual
      const updatedClinics = [...currentClinics];
      updatedClinics.splice(index, 1);
      setCurrentClinics(updatedClinics);
    }
  };

  const handleSaveClinic = () => {
    // Validação básica
    if (!currentClinic.nome) {
      toast.error("Nome da clínica é obrigatório");
      return;
    }

    if (editingClinicIndex !== null) {
      // Atualizar clínica existente
      const updatedClinics = [...currentClinics];
      updatedClinics[editingClinicIndex] = currentClinic;
      setCurrentClinics(updatedClinics);
    } else {
      // Adicionar nova clínica
      setCurrentClinics(prev => [...prev, currentClinic]);
    }

    // Fechar o modal de clínica
    setIsClinicDialogOpen(false);
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentOutbound((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        const response = await fetch(`/api/outbound/${currentOutbound.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentOutbound,
            clinics: currentClinics
          }),
        });

        if (response.ok) {
          const updatedOutbound = await response.json();
          setOutbounds((prev) =>
            prev.map((item) =>
              item.id === updatedOutbound.id ? updatedOutbound : item
            )
          );
          toast.success("Contato atualizado com sucesso!");
        } else {
          toast.error("Erro ao atualizar contato.");
        }
      } else {
        const response = await fetch("/api/outbound", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentOutbound,
            clinics: currentClinics
          }),
        });

        if (response.ok) {
          const newOutbound = await response.json();
          setOutbounds((prev) => [newOutbound, ...prev]);
          toast.success("Contato adicionado com sucesso!");
        } else {
          toast.error("Erro ao adicionar contato.");
        }
      }
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Ocorreu um erro ao processar sua solicitação.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este contato?")) {
      try {
        const response = await fetch(`/api/outbound/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setOutbounds((prev) => prev.filter((item) => item.id !== id));
          toast.success("Contato excluído com sucesso!");
          router.refresh();
        } else {
          toast.error("Erro ao excluir contato.");
        }
      } catch (error) {
        console.error("Erro ao excluir:", error);
        toast.error("Ocorreu um erro ao processar sua solicitação.");
      }
    }
  };

  return (
    <div>
      <div className="hidden md:flex items-center justify-end gap-4 mb-8">
        <Button onClick={handleOpenNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <div className="md:hidden mb-3">
        <div className="flex justify-end">
          <Button onClick={handleOpenNew} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        {/* Mobile view for small screens */}
        <div className="md:hidden space-y-3">
          {outbounds.length > 0 ? (
            outbounds.map((outbound) => (
              <div key={outbound.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2.5">
                  <div className="font-semibold text-base text-gray-900">{outbound.nome}</div>
                  <div>
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium w-fit flex items-center gap-1 ${
                        outbound.status === "abordado"
                          ? "bg-gray-100 text-gray-800 border-none hover:bg-gray-200"
                          : outbound.status === "respondeu"
                          ? "bg-blue-100 text-blue-800 border-none hover:bg-blue-200"
                          : outbound.status === "interessado"
                          ? "bg-amber-100 text-amber-800 border-none hover:bg-amber-200"
                          : outbound.status === "publicou link"
                          ? "bg-green-100 text-green-800 border-none hover:bg-green-200"
                          : outbound.status === "upgrade lead"
                          ? "bg-purple-100 text-purple-800 border-none hover:bg-purple-200"
                          : outbound.status === "convertido"
                          ? "bg-indigo-100 text-indigo-800 border-none hover:bg-indigo-200"
                          : "bg-gray-100 text-gray-800 border-none hover:bg-gray-200"
                      }`}
                    >
                      {outbound.status || "N/A"}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3 text-xs">
                  <div className="flex">
                    <div className="w-24 flex items-center gap-1 text-gray-500">
                      <span>Especialidade:</span>
                    </div>
                    <div className="text-gray-700 font-medium">{outbound.especialidade || 'Não informado'}</div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-24 flex items-center gap-1 text-gray-500">
                      <span>Instagram:</span>
                    </div>
                    <div className="text-gray-700 font-medium">
                      {outbound.instagram ? (
                        <a
                          href={`https://instagram.com/${outbound.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          @{outbound.instagram}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-24 flex items-center gap-1 text-gray-500">
                      <span>WhatsApp:</span>
                    </div>
                    <div className="text-gray-700 font-medium">
                      {outbound.whatsapp ? (
                        <a
                          href={`https://wa.me/${outbound.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:underline"
                        >
                          {outbound.whatsapp}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-24 flex items-center gap-1 text-gray-500">
                      <span>E-mail:</span>
                    </div>
                    <div className="text-gray-700 font-medium">
                      {outbound.email ? (
                        <a
                          href={createGmailLink(outbound.email, outbound.nome)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center"
                          title="Abrir no Gmail"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {outbound.email}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-24 flex items-center gap-1 text-gray-500">
                      <span>Endereço:</span>
                    </div>
                    <div className="text-gray-700 font-medium">
                      {outbound.endereco || 'Não informado'}
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-24 flex items-center gap-1 text-gray-500">
                      <span>Observações:</span>
                    </div>
                    <div className="text-gray-700 font-medium max-w-[230px] truncate" title={outbound.observacoes || ""}>
                      {outbound.observacoes || 'Não informado'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(outbound)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs h-7 w-7 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(outbound.id)}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : !loading ? (
            <div className="bg-white p-4 rounded-xl shadow-sm text-center text-gray-500 text-sm">
              Nenhum contato encontrado
            </div>
          ) : null}
          
          {loading && (
            <div className="bg-white p-4 rounded-xl shadow-sm text-center text-gray-500 text-sm">
              <div className="h-5 w-5 mx-auto animate-spin text-gray-400 mb-2">
                <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              Carregando contatos...
            </div>
          )}
        </div>
        
        {/* Desktop table view */}
        <table className="w-full hidden md:table">
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[15%]">Nome</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[12%]">Especialidade</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[10%]">Instagram</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[10%]">WhatsApp</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[12%]">E-mail</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[10%]">Endereço</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[8%]">Status</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500 w-[13%]">Observações</TableHead>
              <TableHead className="py-3 sm:py-2 px-4 sm:px-3 text-right text-sm sm:text-xs font-medium text-gray-500 w-[10%]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200">
            {outbounds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500 text-sm">
                  Nenhum contato encontrado. Adicione seu primeiro contato!
                </TableCell>
              </TableRow>
            ) : (
              outbounds.map((outbound) => (
                <TableRow key={outbound.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3">
                    <div className="font-medium text-base sm:text-sm text-gray-900">{outbound.nome}</div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3">
                    <div className="text-gray-600 text-sm sm:text-xs">{outbound.especialidade || "-"}</div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3">
                    <div className="text-gray-600 text-sm sm:text-xs">
                      {outbound.instagram ? (
                        <a
                          href={`https://instagram.com/${outbound.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          @{outbound.instagram}
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3">
                    <div className="text-gray-600 text-sm sm:text-xs">
                      {outbound.whatsapp ? (
                        <a
                          href={`https://wa.me/${outbound.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:underline"
                        >
                          {outbound.whatsapp}
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3">
                    <div className="text-gray-600 text-sm sm:text-xs">
                      {outbound.email ? (
                        <a
                          href={createGmailLink(outbound.email, outbound.nome)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center"
                          title="Abrir no Gmail"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {outbound.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3">
                    <div className="text-gray-600 text-sm sm:text-xs">{outbound.endereco || "-"}</div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3">
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium w-fit flex items-center gap-1 ${
                        outbound.status === "abordado"
                          ? "bg-gray-100 text-gray-800 border-none hover:bg-gray-200"
                          : outbound.status === "respondeu"
                          ? "bg-blue-100 text-blue-800 border-none hover:bg-blue-200"
                          : outbound.status === "interessado"
                          ? "bg-amber-100 text-amber-800 border-none hover:bg-amber-200"
                          : outbound.status === "publicou link"
                          ? "bg-green-100 text-green-800 border-none hover:bg-green-200"
                          : outbound.status === "upgrade lead"
                          ? "bg-purple-100 text-purple-800 border-none hover:bg-purple-200"
                          : outbound.status === "convertido"
                          ? "bg-indigo-100 text-indigo-800 border-none hover:bg-indigo-200"
                          : "bg-gray-100 text-gray-800 border-none hover:bg-gray-200"
                      }`}
                    >
                      {outbound.status || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3 w-[13%]">
                    <div className="text-gray-600 text-sm sm:text-xs truncate" title={outbound.observacoes || ""}>
                      {outbound.observacoes || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 sm:py-2 px-4 sm:px-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(outbound)}
                        className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-sm sm:text-xs h-9 sm:h-7 px-3 sm:px-2"
                      >
                        <Pencil className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(outbound.id)}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Contato" : "Novo Contato"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="info">Informações do Médico</TabsTrigger>
                <TabsTrigger value="clinics">Clínicas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={currentOutbound.nome || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input
                      id="especialidade"
                      name="especialidade"
                      value={currentOutbound.especialidade || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      value={currentOutbound.instagram || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={currentOutbound.whatsapp || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="h-4 w-4 mr-1.5" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={currentOutbound.email || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={currentOutbound.status || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>Selecione o status</option>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    value={currentOutbound.endereco || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    value={currentOutbound.observacoes || ""}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="clinics" className="space-y-4 py-4">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Clínicas Vinculadas</h3>
                  <Button 
                    type="button" 
                    onClick={handleAddClinic}
                    variant="outline"
                    size="sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Clínica
                  </Button>
                </div>
                
                {currentClinics.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-lg">
                    <Building className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Nenhuma clínica vinculada.</p>
                    <p className="text-gray-500 text-sm">Clique em "Adicionar Clínica" para vincular uma clínica a este contato.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentClinics.map((clinic, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                          <CardTitle className="text-base">{clinic.nome}</CardTitle>
                          <div className="flex gap-1">
                            <Button 
                              type="button" 
                              onClick={() => handleEditClinic(index)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              type="button" 
                              onClick={() => handleDeleteClinic(index)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {clinic.localizacao && (
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700">{clinic.localizacao}</span>
                              </div>
                            )}
                            {clinic.mediaDeMedicos && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700">{clinic.mediaDeMedicos} médicos</span>
                              </div>
                            )}
                            {clinic.instagram && (
                              <div className="flex items-center gap-2">
                                <Instagram className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <a 
                                  href={`https://instagram.com/${clinic.instagram}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  @{clinic.instagram}
                                </a>
                              </div>
                            )}
                            {clinic.site && (
                              <div className="flex items-center gap-2">
                                <Link className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <a 
                                  href={clinic.site} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  {clinic.site}
                                </a>
                              </div>
                            )}
                            {clinic.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <a 
                                  href={createGmailLink(clinic.email, clinic.nome)}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                  title="Abrir no Gmail"
                                >
                                  {clinic.email}
                                </a>
                              </div>
                            )}
                            {clinic.whatsapp && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <a 
                                  href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-500 hover:underline"
                                >
                                  {clinic.whatsapp}
                                </a>
                              </div>
                            )}
                          </div>
                          {clinic.observacoes && (
                            <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                              {clinic.observacoes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditMode ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Clínica */}
      <Dialog open={isClinicDialogOpen} onOpenChange={setIsClinicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClinicIndex !== null ? "Editar Clínica" : "Nova Clínica"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clinic-nome">Nome da Empresa*</Label>
              <Input
                id="clinic-nome"
                name="nome"
                value={currentClinic.nome || ""}
                onChange={handleClinicChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clinic-localizacao">Localização</Label>
              <Input
                id="clinic-localizacao"
                name="localizacao"
                value={currentClinic.localizacao || ""}
                onChange={handleClinicChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clinic-mediaDeMedicos">Média de Médicos</Label>
              <Input
                id="clinic-mediaDeMedicos"
                name="mediaDeMedicos"
                type="number"
                value={currentClinic.mediaDeMedicos || ""}
                onChange={handleClinicChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-instagram">Instagram</Label>
                <Input
                  id="clinic-instagram"
                  name="instagram"
                  value={currentClinic.instagram || ""}
                  onChange={handleClinicChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinic-whatsapp">WhatsApp</Label>
                <Input
                  id="clinic-whatsapp"
                  name="whatsapp"
                  value={currentClinic.whatsapp || ""}
                  onChange={handleClinicChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clinic-site">Site</Label>
              <Input
                id="clinic-site"
                name="site"
                value={currentClinic.site || ""}
                onChange={handleClinicChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clinic-linkBio">Link na Bio</Label>
              <Input
                id="clinic-linkBio"
                name="linkBio"
                value={currentClinic.linkBio || ""}
                onChange={handleClinicChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-contato">Contato</Label>
                <Input
                  id="clinic-contato"
                  name="contato"
                  value={currentClinic.contato || ""}
                  onChange={handleClinicChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinic-email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-1.5" />
                  E-mail
                </Label>
                <Input
                  id="clinic-email"
                  name="email"
                  type="email"
                  value={currentClinic.email || ""}
                  onChange={handleClinicChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clinic-observacoes">Observações</Label>
              <Textarea
                id="clinic-observacoes"
                name="observacoes"
                value={currentClinic.observacoes || ""}
                onChange={handleClinicChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsClinicDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={handleSaveClinic}
            >
              {editingClinicIndex !== null ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 