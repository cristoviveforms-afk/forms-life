import { useState, useEffect, useRef, MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, MessageSquare, ArrowRight, Phone, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { Accompaniment, Person, Ministry } from '@/types/database';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';

// Define the Journey Stages
// Define the Journey Stages with Modern Styling
const JOURNEY_STAGES = {
  'fase1_porta': {
    label: 'Fase 1: Porta / Dados Iniciais',
    color: 'blue',
    headerClass: 'border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  },
  'fase1_conexao': {
    label: 'Fase 1: Sala de Conexão',
    color: 'indigo',
    headerClass: 'border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20',
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
  },
  'fase2_impacto': {
    label: 'Fase 2: Primeiro Impacto (Semana 1)',
    color: 'orange',
    headerClass: 'border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
  },
  'fase3_retorno': {
    label: 'Fase 3: Ciclo de Retorno',
    color: 'purple',
    headerClass: 'border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-900/20',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
  },
  'fase4_membresia': {
    label: 'Fase 4: Rumo à Membresia',
    color: 'yellow',
    headerClass: 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  },
  'concluido': {
    label: 'Concluído / Membro',
    color: 'green',
    headerClass: 'border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/20',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  }
};

// ... (inside component) ...




export default function Acompanhamento() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [availableMinistries, setAvailableMinistries] = useState<Ministry[]>([]);

  // Dialog/Sheet states
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [contactType, setContactType] = useState('Acompanhamento');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [personHistory, setPersonHistory] = useState<Accompaniment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);


  const [currentDateRange, setCurrentDateRange] = useState({ start: '', end: '' });

  // Drag to scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [searchParams] = useSearchParams();

  // Drag to scroll handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    // Initial fetch handled by MonthYearPicker onDateChange or we fetch default?
    // MonthYearPicker likely fires on mount or default selection.
    // If not, we fetch default. Ensuring fetchMinistries runs.
    fetchMinistries();
  }, []);

  const handleDateChange = (start: string, end: string) => {
    setCurrentDateRange({ start, end });
    fetchData(start, end);
  };

  useEffect(() => {
    const personId = searchParams.get('personId');
    if (personId && people.length > 0) {
      const person = people.find(p => p.id === personId);
      if (person) {
        handleViewDetails(person);
      } else {
        // If not in current list (maybe concluded or different status), try fetching specific person
        // This is a safety fallback if the person isn't in the initial filtered fetch
        const fetchSpecificPerson = async () => {
          const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('id', personId)
            .single();

          if (data && !error) {
            handleViewDetails(data as unknown as Person);
          }
        };
        fetchSpecificPerson();
      }
    }
  }, [searchParams, people]);

  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('people' as any)
        .select('*')
        .or('type.eq.visitante,journey_stage.neq.concluido')
        .order('created_at', { ascending: false });

      if (start && end) {
        const startDay = `${start}T00:00:00`;
        const endDay = `${end}T23:59:59`;
        // Filtering by created_at as requested "like in visitors"
        // Or should we filter by active date? Usually creation date is standard for "arrivals".
        query = query.gte('created_at', startDay).lte('created_at', endDay);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPeople(data as unknown as Person[]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar a jornada.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAvailableMinistries(data as unknown as Ministry[]);
    } catch (error) {
      console.error('Erro ao buscar ministérios:', error);
    }
  };

  const updateStage = async (personId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('people' as any)
        .update({ journey_stage: newStage } as any)
        .eq('id', personId);

      if (error) throw error;

      toast.success('Fase atualizada!');
      // Update local state to avoid full refetch flicker
      setPeople(people.map(p => p.id === personId ? { ...p, journey_stage: newStage as any } : p));
    } catch (error) {
      console.error('Erro ao atualizar fase:', error);
      toast.error('Não foi possível avançar a fase.');
    }
  };

  const handleAddNote = async () => {
    if (!selectedPerson || !noteContent.trim()) return;

    try {
      const { error } = await supabase
        .from('accompaniments' as any)
        .insert([{
          person_id: selectedPerson.id,
          type: contactType,
          observacoes: noteContent,
          status: 'concluido',
          last_contact_date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      toast.success('Observação registrada!');
      setNoteContent('');
      setIsNoteDialogOpen(false);
      // Refresh history if details are open
      if (isDetailsOpen && selectedPerson) {
        handleViewDetails(selectedPerson);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar observação');
    }
  };

  const handleAddMinistry = async (ministryName: string) => {
    if (!selectedPerson) return;

    // Check if already has this ministry
    if (selectedPerson.ministries?.includes(ministryName)) {
      toast.error('Pessoa já está neste ministério');
      return;
    }

    const updatedMinistries = [...(selectedPerson.ministries || []), ministryName];

    try {
      const { error } = await supabase
        .from('people' as any)
        .update({ ministries: updatedMinistries } as any)
        .eq('id', selectedPerson.id);

      if (error) throw error;

      toast.success('Ministério adicionado!');

      const updatedPerson = { ...selectedPerson, ministries: updatedMinistries };
      setSelectedPerson(updatedPerson);
      setPeople(people.map(p => p.id === selectedPerson.id ? updatedPerson : p));

    } catch (error) {
      console.error('Erro ao adicionar ministério:', error);
      toast.error('Erro ao adicionar ministério');
    }
  };

  const handleRemoveMinistry = async (ministryName: string) => {
    if (!selectedPerson) return;

    const updatedMinistries = (selectedPerson.ministries || []).filter(m => m !== ministryName);

    try {
      const { error } = await supabase
        .from('people' as any)
        .update({ ministries: updatedMinistries } as any)
        .eq('id', selectedPerson.id);

      if (error) throw error;

      toast.success('Ministério removido!');

      const updatedPerson = { ...selectedPerson, ministries: updatedMinistries };
      setSelectedPerson(updatedPerson);
      setPeople(people.map(p => p.id === selectedPerson.id ? updatedPerson : p));

    } catch (error) {
      console.error('Erro ao remover ministério:', error);
      toast.error('Erro ao remover ministério');
    }
  };

  const handleViewDetails = async (person: Person) => {
    setSelectedPerson(person);
    setIsDetailsOpen(true);
    try {
      // Fetch Accompaniments
      const { data: historyData } = await supabase
        .from('accompaniments' as any)
        .select('*')
        .eq('person_id', person.id)
        .order('created_at', { ascending: false });

      if (historyData) setPersonHistory(historyData as unknown as Accompaniment[]);

      // Fetch Family if family_id exists
      if (person.family_id) {
        const { data: familyData } = await supabase
          .from('people')
          .select('*')
          .eq('family_id', person.family_id)
          .neq('id', person.id); // Exclude self

        if (familyData) setFamilyMembers(familyData as unknown as Person[]);
      } else {
        setFamilyMembers([]);
      }

    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar detalhes");
    }
  };

  const filterPeople = (stage: string) => {
    return people.filter(p => {
      // Default to fase1_porta if undefined and type is visitante, or check logic
      const pStage = p.journey_stage || (p.type === 'visitante' ? 'fase1_porta' : 'unknown');
      const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return pStage === stage && matchesSearch;
    });
  };

  const getStageColorCode = (stage?: string) => {
    switch (stage) {
      case 'fase1_porta': return '#3b82f6';
      case 'fase1_conexao': return '#6366f1';
      case 'fase2_impacto': return '#f97316';
      case 'fase3_retorno': return '#a855f7';
      case 'fase4_membresia': return '#eab308';
      default: return '#cbd5e1';
    }
  };

  const getNextStage = (current?: string) => {
    switch (current) {
      case 'fase1_porta': return 'fase1_conexao';
      case 'fase1_conexao': return 'fase2_impacto';
      case 'fase2_impacto': return 'fase3_retorno';
      case 'fase3_retorno': return 'fase4_membresia';
      case 'fase4_membresia': return 'concluido';
      default: return null;
    }
  };

  const statusColors: any = {
    pendente: 'secondary',
    em_andamento: 'default',
    concluido: 'success' // Assuming you have a success variant or just use 'default'/'outline'
  };

  const statusLabels: any = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído'
  };

  // Component inside to avoid recreation, but could be outside if no closure deps needed (except updateStage etc)
  const PipelineCard = ({ person }: { person: Person }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: getStageColorCode(person.journey_stage) }}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div onClick={() => handleViewDetails(person)} className="flex-1">
            <p className="font-semibold text-sm truncate">{person.full_name}</p>
            <p className="text-xs text-muted-foreground">{person.phone || 'Sem telefone'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSelectedPerson(person); setContactType('Acompanhamento'); setIsNoteDialogOpen(true); }}>
            <MessageSquare className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-[10px] px-1 h-5">
            {new Date(person.created_at || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </Badge>

          <div className="flex gap-1">
            {getNextStage(person.journey_stage) && (
              <Button
                variant="default"
                size="icon"
                className="h-6 w-6 rounded-full"
                title="Avançar Fase"
                onClick={(e) => { e.stopPropagation(); updateStage(person.id, getNextStage(person.journey_stage)!); }}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {person.accepted_jesus && (
          <Badge className="mt-2 text-[10px] bg-yellow-500 hover:bg-yellow-600 text-white w-full justify-center">Novo Convertido</Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Jornada do Visitante">
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">

        <div className="flex justify-end px-1">
          <MonthYearPicker onDateChange={handleDateChange} />
        </div>

        <div className="flex justify-between items-center px-1">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar visitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData(currentDateRange.start, currentDateRange.end)}>
              Atualizar
            </Button>
          </div>
        </div>

        {/* Pipeline / Kanban View */}
        <ScrollArea
          className="flex-1 pb-4 cursor-grab active:cursor-grabbing"
          viewportRef={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="flex gap-6 pb-4 px-2 min-w-full">
            {Object.entries(JOURNEY_STAGES).map(([stageKey, stageInfo]) => {
              const stagePeople = filterPeople(stageKey);

              return (
                <div key={stageKey} className="min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col h-full">
                  {/* Modern Header */}
                  <div className={`p-4 mb-3 rounded-xl shadow-sm bg-card border flex justify-between items-center group hover:shadow-md transition-all relative overflow-hidden min-h-[5.5rem]`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stageInfo.headerClass.split(' ')[1]}`} /> {/* Extract border color */}
                    <div className="flex flex-col pr-2">
                      <span className="font-bold text-sm text-foreground/90 leading-snug line-clamp-2">{stageInfo.label}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-wider flex items-center gap-1">
                        {stagePeople.length === 1 ? '1 Pessoa' : `${stagePeople.length} Pessoas`}
                      </span>
                    </div>
                    <div className={`h-9 w-9 min-w-[2.25rem] rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${stageInfo.badgeClass}`}>
                      {stagePeople.length}
                    </div>
                  </div>

                  {/* Column Body */}
                  <div className="bg-muted/30 p-2 rounded-xl border-dashed border-2 border-muted flex-1 min-h-[500px]">
                    {stagePeople.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground opacity-50">
                        <div className="bg-muted rounded-full p-3 mb-2">
                          <span className="text-xl">✨</span>
                        </div>
                        <span className="text-xs font-medium">Ninguém nesta fase</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stagePeople.map(person => (
                          <PipelineCard key={person.id} person={person} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Note Dialog */}
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Observação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Registrando acompanhamento para <strong>{selectedPerson?.full_name}</strong>
              </p>

              <div className="space-y-2">
                <Label>Tipo de Contato</Label>
                <Select value={contactType} onValueChange={setContactType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acompanhamento">Acompanhamento Genérico</SelectItem>
                    <SelectItem value="Telefone">Ligação Telefônica</SelectItem>
                    <SelectItem value="WhatsApp">Mensagem WhatsApp</SelectItem>
                    <SelectItem value="Visita">Visita Presencial</SelectItem>
                    <SelectItem value="Feedback">Feedback de Culto</SelectItem>
                    <SelectItem value="Reuniao">Reunião Ministerial</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Digite os detalhes do contato/acompanhamento..."
                className="min-h-[100px]"
              />
              <Button onClick={handleAddNote} className="w-full">Salvar Observação</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Individual Dashboard Sheet */}
        <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedPerson?.full_name ?? ''}`} />
                  <AvatarFallback>{selectedPerson?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span>{selectedPerson?.full_name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{selectedPerson?.type?.toUpperCase()}</span>
                </div>
              </SheetTitle>
            </SheetHeader>

            {selectedPerson && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                  <TabsTrigger value="ministries">Ministérios</TabsTrigger>
                  <TabsTrigger value="family">Família</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-secondary/30 p-3 rounded-lg text-center">
                      <span className="block text-2xl font-bold">{personHistory.length}</span>
                      <span className="text-xs text-muted-foreground">Contatos</span>
                    </div>
                    <div className="bg-secondary/30 p-3 rounded-lg text-center">
                      <span className="block text-2xl font-bold">{personHistory.filter(h => h.status === 'concluido').length}</span>
                      <span className="text-xs text-muted-foreground">Concluídos</span>
                    </div>
                    <div className="bg-secondary/30 p-3 rounded-lg text-center">
                      <span className="block text-2xl font-bold">{personHistory[0]?.created_at ? new Date(personHistory[0].created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}</span>
                      <span className="text-xs text-muted-foreground">Último</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedPerson.phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    className="w-full"
                    onClick={() => {
                      setNoteContent('');
                      setContactType('Acompanhamento');
                      setIsNoteDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Registrar Novo Contato
                  </Button>
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Histórico de Contatos
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNoteContent('');
                        setContactType('Acompanhamento');
                        setIsNoteDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Novo
                    </Button>
                  </div>

                  {personHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground italic">
                      Nenhum histórico registrado.
                    </div>
                  ) : (
                    <div className="relative border-l ml-2 space-y-6 pl-6">
                      {personHistory.map((history) => (
                        <div key={history.id} className="relative">
                          <div className="absolute -left-[29px] h-3 w-3 rounded-full bg-primary" />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{history.type}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(history.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-1">
                              {history.observacoes || 'Sem observações'}
                            </p>
                            <Badge className="w-fit mt-1" variant={statusColors[history.status] || 'secondary'}>{statusLabels[history.status] || history.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ministries" className="space-y-4 mt-4">
                  <div className="space-y-2 p-4 bg-secondary/10 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-muted-foreground text-xs font-semibold">ENCAMINHAR PARA MINISTÉRIO</Label>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Select onValueChange={(value) => handleAddMinistry(value)}>
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue placeholder="Selecionar Ministério..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMinistries.map((m) => (
                            <SelectItem key={m.id} value={m.name}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium">Ministérios Vinculados:</Label>
                      <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {selectedPerson.ministries && selectedPerson.ministries.length > 0 ? (
                          selectedPerson.ministries.map(m => (
                            <Badge key={m} variant="secondary" className="pl-3 pr-2 py-1.5 flex items-center gap-2 text-sm">
                              {m}
                              <button
                                onClick={() => handleRemoveMinistry(m)}
                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                title="Remover"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Nenhum ministério vinculado.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="family" className="space-y-4 mt-4">
                  {familyMembers.length > 0 ? (
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <span role="img" aria-label="family">👨‍👩‍👧‍👦</span> Membros da Família ({familyMembers.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {familyMembers.map((member) => (
                          <div
                            key={member.id}
                            className="border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleViewDetails(member)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                              <p className="font-medium text-sm truncate">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {member.type} • {member.birth_date ? new Date().getFullYear() - new Date(member.birth_date).getFullYear() : '?'} anos
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="ml-auto">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <p>Nenhum membro da família encontrado.</p>
                      <Button variant="link" size="sm">Adicionar Familiar (Em breve)</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
