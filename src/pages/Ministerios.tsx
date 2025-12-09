import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Users, Loader2, Phone, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Ministry } from '@/types/database';
import { toast } from 'sonner';

interface Person {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  type: string;
  ministries: string[] | null;
}

export default function Ministerios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ministerios, setMinisterios] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [ministryMembers, setMinistryMembers] = useState<Person[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // New Ministry Form State
  const [newMinistry, setNewMinistry] = useState({
    name: '',
    leader: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Ministry Form State
  const [editMinistry, setEditMinistry] = useState({
    name: '',
    leader: '',
    description: ''
  });

  useEffect(() => {
    fetchMinisterios();
  }, []);

  const fetchMinisterios = async () => {
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .order('name');

      if (error) throw error;
      setMinisterios(data as unknown as Ministry[]);
    } catch (error) {
      console.error('Erro ao buscar ministérios:', error);
      toast.error('Erro ao carregar ministérios');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembersOfMinistry = async (ministryName: string) => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, full_name, phone, email, type, ministries')
        .contains('ministries', [ministryName]);

      if (error) throw error;
      setMinistryMembers(data || []);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateMinistry = async () => {
    if (!newMinistry.name) {
      toast.error('Nome do ministério é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ministries')
        .insert([
          {
            name: newMinistry.name,
            leader: newMinistry.leader || null,
            description: newMinistry.description || null
          }
        ]);

      if (error) throw error;

      toast.success('Ministério criado com sucesso!');
      setNewMinistry({ name: '', leader: '', description: '' });
      setIsDialogOpen(false);
      fetchMinisterios();
    } catch (error) {
      console.error('Erro ao criar ministério:', error);
      toast.error('Erro ao criar ministério');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    await fetchMembersOfMinistry(ministry.name);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setEditMinistry({
      name: ministry.name,
      leader: ministry.leader || '',
      description: ministry.description || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditMinistry = async () => {
    if (!selectedMinistry) return;
    if (!editMinistry.name) {
      toast.error('Nome do ministério é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ministries')
        .update({
          name: editMinistry.name,
          leader: editMinistry.leader || null,
          description: editMinistry.description || null,
        })
        .eq('id', selectedMinistry.id);

      if (error) throw error;

      toast.success('Ministério atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedMinistry(null);
      fetchMinisterios();
    } catch (error) {
      console.error('Erro ao atualizar ministério:', error);
      toast.error('Erro ao atualizar ministério');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (ministry: Ministry) => {
    try {
      const { error } = await supabase
        .from('ministries')
        .update({ active: !ministry.active })
        .eq('id', ministry.id);

      if (error) throw error;

      toast.success(ministry.active ? 'Ministério desativado' : 'Ministério ativado');
      fetchMinisterios();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'membro':
        return 'Membro';
      case 'visitante':
        return 'Visitante';
      case 'convertido':
        return 'Convertido';
      default:
        return type;
    }
  };

  const filteredMinisterios = ministerios.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Ministérios">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ministérios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ministério
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Ministério</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Ministério *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Louvor e Adoração"
                    value={newMinistry.name}
                    onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lider">Líder</Label>
                  <Input
                    id="lider"
                    placeholder="Nome do líder"
                    value={newMinistry.leader}
                    onChange={(e) => setNewMinistry({ ...newMinistry, leader: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descrição do ministério"
                    value={newMinistry.description}
                    onChange={(e) => setNewMinistry({ ...newMinistry, description: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateMinistry} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Criar Ministério
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : ministerios.length}</div>
              <p className="text-xs text-muted-foreground">Total de Ministérios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : ministerios.filter(m => m.active).length}</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : ministerios.filter(m => !m.active).length}</div>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Ministry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            filteredMinisterios.map((ministerio) => (
              <Card
                key={ministerio.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(ministerio)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{ministerio.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(ministerio);
                      }}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(ministerio);
                      }}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(ministerio);
                        }}
                        className={ministerio.active ? 'text-destructive' : 'text-green-600'}
                      >
                        {ministerio.active ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Líder:</span>{' '}
                      <span className="font-medium">{ministerio.leader || 'Não definido'}</span>
                    </div>
                    {ministerio.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{ministerio.description}</p>
                    )}
                    <Badge variant={ministerio.active ? 'default' : 'secondary'}>
                      {ministerio.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Ministério</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome do Ministério *</Label>
                <Input
                  id="edit-nome"
                  placeholder="Ex: Louvor e Adoração"
                  value={editMinistry.name}
                  onChange={(e) => setEditMinistry({ ...editMinistry, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lider">Líder</Label>
                <Input
                  id="edit-lider"
                  placeholder="Nome do líder"
                  value={editMinistry.leader}
                  onChange={(e) => setEditMinistry({ ...editMinistry, leader: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  placeholder="Descrição do ministério"
                  value={editMinistry.description}
                  onChange={(e) => setEditMinistry({ ...editMinistry, description: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleEditMinistry} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Sheet */}
        <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedMinistry?.name}
                <Badge variant={selectedMinistry?.active ? 'default' : 'secondary'}>
                  {selectedMinistry?.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Ministry Info */}
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Líder:</span>
                  <p className="font-medium">{selectedMinistry?.leader || 'Não definido'}</p>
                </div>
                {selectedMinistry?.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Descrição:</span>
                    <p className="text-sm">{selectedMinistry.description}</p>
                  </div>
                )}
              </div>

              {/* Members */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Membros ({ministryMembers.length})
                </h3>
                {loadingMembers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : ministryMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum membro cadastrado neste ministério
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ministryMembers.map((person) => (
                      <Card key={person.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{person.full_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Phone className="h-3 w-3" />
                              {person.phone}
                            </div>
                            {person.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {person.email}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">{getTypeLabel(person.type)}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
