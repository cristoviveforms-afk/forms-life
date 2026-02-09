import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Users, Loader2, Phone, Mail, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Ministry, Person, Accompaniment } from '@/types/database';
import { toast } from 'sonner';

interface MinistryPerson extends Person {
  pipeline_status?: string;
  last_contact?: string;
}

interface RecentPerson extends Person {
  accompaniment_status?: string;
  last_feedback?: string;
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
  const [ministryToDelete, setMinistryToDelete] = useState<Ministry | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // View Mode: 'overview' or ministry_id
  const [viewMode, setViewMode] = useState<string>('overview');
  const [pipelinePeople, setPipelinePeople] = useState<MinistryPerson[]>([]);
  const [loadingPipeline, setLoadingPipeline] = useState(false);

  // New Ministry Form State
  const [newMinistry, setNewMinistry] = useState({
    name: '',
    leader: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Ministry Form State
  const [recentPeople, setRecentPeople] = useState<RecentPerson[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [selectedPersonForFollowUp, setSelectedPersonForFollowUp] = useState<Person | null>(null);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    feedback: '',
    type: 'Ligação',
    status: 'concluido' // Default to done when logging
  });

  const [editMinistry, setEditMinistry] = useState({
    name: '',
    leader: '',
    description: ''
  });

  useEffect(() => {
    fetchMinisterios();
    fetchRecentPeople();
  }, []);

  useEffect(() => {
    if (viewMode !== 'overview') {
      fetchMinistryPipeline(viewMode);
    }
  }, [viewMode]);

  const fetchRecentPeople = async () => {
    setLoadingRecent(true);
    try {
      // Get date 30 days ago
      const date30DaysAgo = new Date();
      date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
      const dateStr = date30DaysAgo.toISOString();

      // Fetch people created recently OR converted recently OR integrated recently
      const { data: peopleData, error: peopleError } = await supabase
        .from('people' as any)
        .select('*')
        .or(`created_at.gte.${dateStr},integration_date.gte.${dateStr},conversion_date.gte.${dateStr}`)
        .order('created_at', { ascending: false });

      if (peopleError) throw peopleError;

      // Fetch existing accompaniments for these people to check status
      const { data: accData, error: accError } = await supabase
        .from('accompaniments' as any)
        .select('*');

      if (accError && accError.code !== '42P01') { // Ignore table not found if it happens
        console.error(accError);
      }

      const peopleWithStatus = (peopleData || []).map(p => {
        const acc = (accData || []).find((a: any) => a.person_id === p.id);
        return {
          ...p,
          accompaniment_status: acc ? 'Contatado' : 'Pendente',
          last_feedback: acc?.feedback
        };
      });

      setRecentPeople(peopleWithStatus as unknown as RecentPerson[]);

    } catch (error) {
      console.error('Error fetching recent people:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchMinistryPipeline = async (ministryId: string) => {
    setLoadingPipeline(true);
    const ministry = ministerios.find(m => m.id === ministryId);
    if (!ministry) return;

    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .contains('ministries', [ministry.name]);

      if (error) throw error;

      // Fetch accompaniments to determine status
      const { data: accData } = await supabase
        .from('accompaniments' as any)
        .select('*');

      const peopleWithStatus = (data || []).map((p: any) => {
        // Filter accompaniments for this person
        const personAccs = (accData || []).filter((a: any) => a.person_id === p.id);
        // Check if there is any accompaniment that is recent? Or just any?
        // For now, if there is ANY accompaniment, we consider "Em Acompanhamento".
        // If there is a "concluido" specifically for this ministry... 
        // Since we don't have ministry_id in accompaniments, we'll use a simple heuristic for now.

        let status = 'aguardando';
        if (personAccs.length > 0) {
          status = 'em_andamento';
          // Check if latest is 'concluido' - this logic might need refinement based on exact requirements
          // For now, let's keep it simple: if they have accompaniments, they are being followed up.
        }

        return { ...p, pipeline_status: status, last_contact: personAccs[0]?.created_at };
      });

      setPipelinePeople(peopleWithStatus as unknown as MinistryPerson[]);

    } catch (error) {
      console.error('Erro ao buscar pipeline:', error);
      toast.error('Erro ao carregar pipeline');
    } finally {
      setLoadingPipeline(false);
    }
  };


  const handleSaveFollowUp = async () => {
    if (!selectedPersonForFollowUp) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('accompaniments' as any)
        .insert([{
          person_id: selectedPersonForFollowUp.id,
          // leader_name: 'Líder', // Removed as it likely doesn't exist in schema
          last_contact_date: new Date().toISOString().split('T')[0],
          observacoes: followUpData.feedback, // Map feedback to observacoes
          type: followUpData.type,
          status: followUpData.status
        }] as any);

      if (error) throw error;

      toast.success('Contato registrado com sucesso!');
      setIsFollowUpDialogOpen(false);
      setFollowUpData({ feedback: '', type: 'Ligação', status: 'concluido' });

      // Refresh based on current view
      if (viewMode === 'overview') {
        fetchRecentPeople();
      } else {
        fetchMinistryPipeline(viewMode);
      }

    } catch (error) {
      console.error('Error saving follow up:', error);
      toast.error('Erro ao registrar contato');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleDeleteMinistry = async () => {
    if (!ministryToDelete) return;

    try {
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', ministryToDelete.id);

      if (error) throw error;

      toast.success('Ministério excluído com sucesso');
      fetchMinisterios();
    } catch (error) {
      console.error('Erro ao excluir ministério:', error);
      toast.error('Erro ao excluir ministério');
    } finally {
      setIsDeleteAlertOpen(false);
      setMinistryToDelete(null);
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
      <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">

          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[200px] font-medium">
                <SelectValue placeholder="Selecione a visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Visão Geral (Admin)</SelectItem>
                {ministerios.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {viewMode === 'overview' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
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
          )}
        </div>

        {viewMode === 'overview' ? (
          <ScrollArea className="flex-1">
            <div className="space-y-6 pb-6">
              {/* Integration Panel */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Painel de Integração (Novos nos últimos 30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRecent ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                  ) : recentPeople.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhuma nova pessoa para integrar no momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentPeople.map(p => (
                        <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-secondary/20 rounded-lg border gap-3">
                          <div>
                            <p className="font-semibold text-lg">{p.full_name}</p>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>{p.type === 'membro' ? 'Novo Membro' : 'Novo Convertido'}</span>
                              <span>•</span>
                              <span>{p.phone}</span>
                            </div>
                            {p.last_feedback && (
                              <p className="text-xs text-muted-foreground mt-1 italic">" {p.last_feedback} "</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Badge variant={p.accompaniment_status === 'Contatado' ? 'default' : 'destructive'}>
                              {p.accompaniment_status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPersonForFollowUp(p);
                                setIsFollowUpDialogOpen(true);
                              }}
                            >
                              <Phone className="h-3 w-3 mr-2" />
                              Registrar Contato
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setMinistryToDelete(ministerio);
                                setIsDeleteAlertOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              Excluir
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
            </div>
          </ScrollArea>
        ) : (
          /* Ministry Pipeline View */
          <div className="flex-1 overflow-auto bg-muted/10 rounded-lg border p-4">
            <div className="flex gap-4 min-w-full h-full">
              {/* Column 1: Aguardando Contato */}
              <div className="flex-1 min-w-[300px] flex flex-col gap-3">
                <div className="flex items-center justify-between p-2 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                  <span className="font-semibold">Aguardando Contato</span>
                  <Badge variant="secondary" className="bg-white">{pipelinePeople.filter((p) => p.pipeline_status === 'aguardando').length}</Badge>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {pipelinePeople.filter((p) => p.pipeline_status === 'aguardando').map((person) => (
                    <Card key={person.id} className="border-l-4 border-l-yellow-400 cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{person.full_name}</p>
                            <p className="text-xs text-muted-foreground">{person.phone || 'Sem telefone'}</p>
                            <Badge variant="outline" className="mt-2 text-[10px]">{person.type}</Badge>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                            setSelectedPersonForFollowUp(person);
                            setIsFollowUpDialogOpen(true);
                          }}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Column 2: Em Acompanhamento */}
              <div className="flex-1 min-w-[300px] flex flex-col gap-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                  <span className="font-semibold">Em Acompanhamento</span>
                  <Badge variant="secondary" className="bg-white">{pipelinePeople.filter((p) => p.pipeline_status === 'em_andamento').length}</Badge>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {pipelinePeople.filter((p) => p.pipeline_status === 'em_andamento').map((person) => (
                    <Card key={person.id} className="border-l-4 border-l-blue-400 cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{person.full_name}</p>
                            <p className="text-xs text-muted-foreground">Último: {new Date(person.last_contact).toLocaleDateString()}</p>

                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                            setSelectedPersonForFollowUp(person);
                            setIsFollowUpDialogOpen(true);
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Column 3: Concluídos */}
              <div className="flex-1 min-w-[300px] flex flex-col gap-3">
                <div className="flex items-center justify-between p-2 bg-green-50 text-green-800 rounded-md border border-green-200">
                  <span className="font-semibold">Integrados/Concluído</span>
                  <Badge variant="secondary" className="bg-white">{pipelinePeople.filter((p) => p.pipeline_status === 'concluido').length}</Badge>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {/* Empty for now as logic implies filtering, add mock or real logic later */}
                  <div className="text-center text-xs text-muted-foreground p-4">
                    Concluídos aparecerão aqui
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Follow Up Dialog */}
        <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Contato com {selectedPersonForFollowUp?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Contato</Label>
                <div className="flex gap-2">
                  {['Ligação', 'WhatsApp', 'Visita', 'Conversa'].map(t => (
                    <Badge
                      key={t}
                      variant={followUpData.type === t ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFollowUpData({ ...followUpData, type: t })}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Feedback / Observações</Label>
                <Textarea
                  placeholder="Como foi a conversa? A pessoa demonstrou interesse?"
                  value={followUpData.feedback}
                  onChange={e => setFollowUpData({ ...followUpData, feedback: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleSaveFollowUp} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                Salvar Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            {/* ... existing edit content ... */}
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

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o ministério
                "{ministryToDelete?.name}" e removerá seus dados dos nossos servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMinistry}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
