import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Phone, MessageCircle, Loader2, User, Building2, Heart, History, MessageSquare, UserPlus, Users, X, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
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
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types/database';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';

interface FamilyGroup {
  id: string;
  mainPerson: Person;
  dependents: Person[];
}

const getFamilyGroups = (visitors: Person[]): FamilyGroup[] => {
  const groups = new Map<string, FamilyGroup>();

  visitors.forEach(v => {
    const key = v.family_id || v.id;
    if (!groups.has(key)) {
      groups.set(key, { id: key, mainPerson: v, dependents: [] });
    } else {
      const group = groups.get(key)!;
      const ministries = Array.isArray(v.ministries) ? v.ministries as string[] : [];
      const mainMinistries = Array.isArray(group.mainPerson.ministries) ? group.mainPerson.ministries as string[] : [];

      const isVDependent = v.civil_status === 'conjuge' || v.civil_status === 'noivo' || v.civil_status === 'namorado' || ministries.includes('Ministério Infantil (Kids)');
      const isMainDependent = group.mainPerson.civil_status === 'conjuge' || group.mainPerson.civil_status === 'noivo' || group.mainPerson.civil_status === 'namorado' || mainMinistries.includes('Ministério Infantil (Kids)');

      if (isMainDependent && !isVDependent) {
        group.dependents.push(group.mainPerson);
        group.mainPerson = v;
      } else if (new Date(v.created_at) < new Date(group.mainPerson.created_at) && !isVDependent && !isMainDependent) {
        group.dependents.push(group.mainPerson);
        group.mainPerson = v;
      } else {
        group.dependents.push(v);
      }
    }
  });

  return Array.from(groups.values());
};

export default function Visitantes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [visitantes, setVisitantes] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitanteToDelete, setVisitanteToDelete] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [personHistory, setPersonHistory] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [availableMinistries, setAvailableMinistries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleDateChange = (start: string, end: string) => {
    fetchVisitantes(start, end);
  };

  const fetchVisitantes = async (start: string, end: string) => {
    setLoading(true);
    try {
      const startDay = `${start}T00:00:00`;
      const endDay = `${end}T23:59:59`;

      const { data, error } = await supabase
        .from('people' as any)
        .select('*')
        .eq('type', 'visitante')
        .gte('created_at', startDay)
        .lte('created_at', endDay);

      if (error) throw error;
      setVisitantes(data as unknown as Person[]);
    } catch (error) {
      console.error('Erro ao buscar visitantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!visitanteToDelete) return;

    try {
      const { error } = await supabase
        .from('people' as any)
        .delete()
        .eq('id', visitanteToDelete.id);

      if (error) throw error;

      setVisitantes(visitantes.filter(v => v.id !== visitanteToDelete.id));
      setDeleteDialogOpen(false);
      setVisitanteToDelete(null);
      toast.success('Visitante removido com sucesso.');
    } catch (error) {
      console.error('Erro ao remover visitante:', error);
      toast.error('Erro ao remover visitante.');
    }
  };

  const handleViewDetails = async (person: Person) => {
    setSelectedPerson(person);
    setIsDetailsOpen(true);
    setLoadingHistory(true);

    setSearchParams({ personId: person.id }, { replace: true });

    try {
      const { data: history } = await supabase
        .from('accompaniments')
        .select('*')
        .eq('person_id', person.id)
        .order('created_at', { ascending: false });

      setPersonHistory(history || []);

      const { data: family } = await supabase
        .from('people')
        .select('*')
        .eq('family_id', person.family_id || 'none');

      setFamilyMembers(family?.filter(f => f.id !== person.id) || []);

      const { data: ministries } = await supabase
        .from('ministries')
        .select('*');
      setAvailableMinistries(ministries || []);

    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleStatus = async (personOverride?: Person) => {
    const person = personOverride || selectedPerson;
    if (!person) return;

    const newType = person.type === 'visitante' ? 'membro' : 'visitante';
    const confirmMsg = newType === 'membro'
      ? `Converter ${person.full_name} em Membro?`
      : `Mudar ${person.full_name} para Visitante?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const updates: any = { type: newType };
      if (newType === 'membro') {
        updates.integration_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('people' as any)
        .update(updates)
        .eq('id', person.id);

      if (error) throw error;
      toast.success(`Status atualizado para ${newType === 'membro' ? 'Membro' : 'Visitante'}!`);

      const updatedPerson = { ...person, type: newType as any };
      if (selectedPerson?.id === person.id) setSelectedPerson(updatedPerson);
      setVisitantes(visitantes.map(v => v.id === person.id ? updatedPerson : v));
    } catch (error) {
      toast.error('Erro ao alterar status.');
    }
  };

  useEffect(() => {
    const personId = searchParams.get('personId');
    if (personId && visitantes.length > 0 && selectedPerson?.id !== personId) {
      const person = visitantes.find(v => v.id === personId);
      if (person) handleViewDetails(person);
    }
  }, [searchParams, visitantes, selectedPerson?.id]);

  const filteredGroups = getFamilyGroups(visitantes).filter((group) => {
    const term = searchTerm.toLowerCase();
    return group.mainPerson.full_name.toLowerCase().includes(term) ||
      group.dependents.some(dep => dep.full_name.toLowerCase().includes(term));
  });

  const stats = {
    total: visitantes.length,
    hoje: visitantes.filter(v => {
      const date = v.created_at ? new Date(v.created_at) : null;
      const today = new Date();
      return date && date.toDateString() === today.toDateString();
    }).length,
    primeiraVez: visitantes.filter(v => v.visitor_first_time).length,
    'aguardando contato': visitantes.filter(v => v.visitor_wants_contact).length,
  };

  return (
    <DashboardLayout title="Visitantes">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-light tracking-tight text-foreground">Visitantes</h2>
            <p className="text-sm text-muted-foreground">Gerencie os visitantes e sua jornada na igreja.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex rounded-sm h-9">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => navigate('/cadastro?tipo=visitante')} size="sm" className="rounded-sm h-9 font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Novo Visitante
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-border/60">
          <div className="w-full sm:w-64">
            <MonthYearPicker onDateChange={handleDateChange} />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-sm bg-muted/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <Button variant="outline" className="h-10 rounded-sm hidden sm:flex">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 mb-8">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Geral</p>
            <div className="text-3xl font-light text-foreground">{loading ? '-' : stats.total}</div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Hoje</p>
            <div className="text-3xl font-light text-foreground">{loading ? '-' : stats.hoje}</div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">1ª Vez</p>
            <div className="text-3xl font-light text-primary">{loading ? '-' : stats.primeiraVez}</div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Contato Req.</p>
            <div className="text-3xl font-light text-foreground">{loading ? '-' : stats['aguardando contato']}</div>
          </div>
        </div>

        <div className="space-y-0 pb-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">Nenhum visitante encontrado neste período.</p>
          ) : (
            filteredGroups.map((group) => {
              const visitante = group.mainPerson;
              return (
                <div
                  key={group.id}
                  className="clean-list-item cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  onClick={() => handleViewDetails(visitante)}
                >
                  <div className="flex flex-col sm:flex-row gap-4 relative">
                    {group.dependents.length > 0 && <div className="family-node-line top-14 bottom-4"></div>}

                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted/50 border border-border flex items-center justify-center font-medium text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      {visitante.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base tracking-tight text-foreground/90">{visitante.full_name}</span>
                        {visitante.visitor_first_time && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-primary border border-primary/30 px-1.5 py-0.5 rounded-sm">1ª Vez</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{visitante.phone || 'S/N'}</span>
                      </div>

                      {group.dependents.length > 0 && (
                        <div className="pt-2 pl-4 space-y-2 relative z-10">
                          {group.dependents.map(dep => (
                            <div key={dep.id} className="text-xs text-muted-foreground flex items-center gap-2 relative">
                              <div className="family-sub-node-corner"></div>
                              <span className="font-medium text-foreground/80">{dep.full_name}</span>
                              <span className="text-[9px] uppercase tracking-widest opacity-60 bg-muted px-1.5 py-0.5 rounded-sm">{dep.civil_status || 'dependente'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cleanPhone = visitante.phone?.replace(/\D/g, '');
                        if (!cleanPhone) return toast.error("Sem telefone");
                        const phoneWithCountry = cleanPhone?.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                        window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(visitante);
                        }}>
                          Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Registrar Contato</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(visitante); }}>Converter para Membro</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisitanteToDelete(visitante);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{visitanteToDelete?.full_name}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setVisitanteToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-sm"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet open={isDetailsOpen} onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setSearchParams({}, { replace: true });
          }
        }}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selectedPerson?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-bold text-xl tracking-tight">{selectedPerson?.full_name}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-primary/10 text-primary border-none">
                      {selectedPerson?.type}
                    </Badge>
                    {selectedPerson?.invited_by && (
                      <span className="text-xs font-normal text-muted-foreground">• Convidado por {selectedPerson.invited_by}</span>
                    )}
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>

            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Carregando painel...</p>
              </div>
            ) : selectedPerson && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Histórico</TabsTrigger>
                  <TabsTrigger value="ministries" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Ministérios</TabsTrigger>
                  <TabsTrigger value="family" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Família</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border shadow-sm p-4 rounded-2xl text-center hover:bg-accent/10 transition-colors">
                      <span className="block text-2xl font-black text-primary">{personHistory.length}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none">Contatos</span>
                    </div>
                    <div className="bg-card border shadow-sm p-4 rounded-2xl text-center hover:bg-accent/10 transition-colors">
                      <span className="block text-2xl font-black text-primary">{personHistory.filter(h => h.status === 'concluido').length}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none">Concluídos</span>
                    </div>
                    <div className="bg-card border shadow-sm p-4 rounded-2xl text-center hover:bg-accent/10 transition-colors">
                      <span className="block text-2xl font-black text-primary">
                        {personHistory[0]?.created_at ? new Date(personHistory[0].created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none">Último</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div
                      className="flex items-center gap-3 p-4 bg-muted/40 backdrop-blur-sm rounded-2xl border cursor-pointer hover:bg-green-500/10 hover:border-green-500/30 transition-all group"
                      onClick={() => {
                        const cleanPhone = selectedPerson.phone?.replace(/\D/g, '');
                        const phoneWithCountry = cleanPhone?.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                        window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
                      }}
                    >
                      <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-green-500/20 transition-colors">
                        <Phone className="h-5 w-5 text-primary group-hover:text-green-600" />
                      </div>
                      <span className="font-bold text-lg tracking-tight group-hover:text-green-600 transition-colors">{selectedPerson.phone}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => navigate(`/cadastro?personId=${selectedPerson.id}`)}
                      >
                        <span className="mr-2">✏️</span> Editar Cadastro
                      </Button>
                      <Button
                        className="flex-1 h-12"
                        onClick={() => {
                          toast.info('Para registrar contatos, use a aba Acompanhamento.');
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Registrar Novo Contato
                      </Button>
                    </div>

                    <Button
                      variant="secondary"
                      className={cn(
                        "w-full h-11 font-bold group",
                        selectedPerson.type === 'visitante'
                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                      )}
                      onClick={() => handleToggleStatus()}
                    >
                      {selectedPerson.type === 'visitante' ? (
                        <><Users className="mr-2 h-4 w-4" /> Converter em Membro</>
                      ) : (
                        <><UserPlus className="mr-2 h-4 w-4" /> Tornar Visitante</>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {personHistory.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>Nenhum histórico registrado.</p>
                      </div>
                    ) : personHistory.map((item) => (
                      <div key={item.id} className="p-4 rounded-2xl border bg-card/50">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="capitalize">{item.contact_type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-sm font-medium">{item.notes}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ministries" className="space-y-4 mt-4">
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Ministérios Ativos
                    </h4>
                    <p className="text-xs text-muted-foreground italic">Gerencie os ministérios na aba Ministérios.</p>
                  </div>
                </TabsContent>

                <TabsContent value="family" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {familyMembers.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground italic">Nenhum familiar vinculado.</div>
                    ) : familyMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.full_name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(member)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </SheetContent>
        </Sheet>
      </div >
    </DashboardLayout >
  );
}
