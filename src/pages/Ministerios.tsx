import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Users, Loader2, Phone, Mail, MessageSquare, ArrowRight, CheckCircle2, ExternalLink, Calendar, ClipboardList, Settings, ChevronLeft, UserPlus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Ministry, Person, Accompaniment } from '@/types/database';
import { toast } from 'sonner';

// --- Interfaces ---

interface MinistryPerson extends Person {
  pipeline_status?: string;
  last_contact?: string;
}

interface RecentPerson extends Person {
  accompaniment_status?: string;
  last_feedback?: string;
}

interface MinistryEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  leader_in_charge?: string;
}

// --- Ministry Dashboard Component ---

const MinistryDashboard = ({
  ministry,
  onBack,
  members,
  pipeline,
  onRefreshPipeline
}: {
  ministry: Ministry,
  onBack: () => void,
  members: Person[],
  pipeline: MinistryPerson[],
  onRefreshPipeline: () => void
}) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<MinistryEvent[]>([]);
  // Update newEvent state to include selectedMembers
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '', leader: '', selectedMembers: [] as string[] });
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem(`ministry_events_${ministry.id}`);
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, [ministry.id]);

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error("Preencha título e data");
      return;
    }
    const event: MinistryEvent = {
      id: crypto.randomUUID(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      // description will be set below with members appended
      leader_in_charge: newEvent.leader,
      description: `${newEvent.description || ''}\n\nEscalados: ${members.filter(m => newEvent.selectedMembers.includes(m.id)).map(m => m.full_name).join(', ')}`.trim()
    };
    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    localStorage.setItem(`ministry_events_${ministry.id}`, JSON.stringify(updatedEvents));
    setNewEvent({ title: '', date: '', time: '', description: '', leader: '', selectedMembers: [] });
    setIsEventDialogOpen(false);
    toast.success("Evento/Escala criado com sucesso!");
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    localStorage.setItem(`ministry_events_${ministry.id}`, JSON.stringify(updatedEvents));
    toast.success("Evento removido");
  };

  const toggleMemberSelection = (memberId: string) => {
    setNewEvent(prev => {
      const isSelected = prev.selectedMembers.includes(memberId);
      if (isSelected) {
        return { ...prev, selectedMembers: prev.selectedMembers.filter(id => id !== memberId) };
      } else {
        return { ...prev, selectedMembers: [...prev.selectedMembers, memberId] };
      }
    });
  };

  const pendingCount = pipeline.filter(p => p.pipeline_status === 'aguardando').length;
  const adoptionCount = pipeline.filter(p => p.pipeline_status === 'em_andamento').length;
  const completedCount = pipeline.filter(p => p.pipeline_status === 'concluido').length;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-xl md:text-2xl font-bold truncate">
                {ministry.name}
              </h2>
              <Badge variant={ministry.active ? 'default' : 'secondary'} className="text-[10px] h-5">
                {ministry.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {members.length}</span>
              <span className="flex items-center gap-1 truncate"><UserPlus className="h-3 w-3" /> {ministry.leader || 'Sem líder'}</span>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsEventDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Escala / Evento
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-4 md:gap-6 shrink-0 overflow-x-auto overflow-y-hidden">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 md:px-2 py-3 text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="people" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 md:px-2 py-3 text-sm">Pessoas & Pipeline</TabsTrigger>
          <TabsTrigger value="scales" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 md:px-2 py-3 text-sm">Escalas</TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-6 overflow-hidden flex flex-col min-h-0">
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="h-full m-0 p-0">
            <ScrollArea className="h-full pr-4 pb-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Aguardando Contato</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{pendingCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">Visitantes precisando de atenção</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Em Acompanhamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{adoptionCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">Sendo cuidados atualmente</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Próximos Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{events.filter(e => new Date(e.date) >= new Date()).length}</div>
                      <p className="text-xs text-muted-foreground mt-1">Escalas agendadas</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Activity Mini-Feed */}
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">Membros Recentes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                      <ScrollArea className="h-[300px]">
                        <div className="flex flex-col">
                          {members.slice(0, 5).map(member => (
                            <div key={member.id} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/acompanhamento?personId=${member.id}`)}>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {member.full_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{member.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{member.phone}</p>
                                </div>
                              </div>
                              <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                            </div>
                          ))}
                          {members.length === 0 && <p className="p-4 text-sm text-center text-muted-foreground">Nenhum membro encontrado.</p>}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Upcoming Events Mini-List */}
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">Próximas Escalas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                      <ScrollArea className="h-[300px]">
                        <div className="flex flex-col">
                          {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5).map(event => (
                            <div key={event.id} className="p-4 border-b last:border-0 flex items-start gap-3">
                              <div className="flex flex-col items-center justify-center bg-muted rounded-md p-2 min-w-[50px]">
                                <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                <span className="text-lg font-bold">{new Date(event.date).getDate()}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.time} • {event.leader_in_charge || 'Sem responsável'}</p>
                              </div>
                            </div>
                          ))}
                          {events.length === 0 && <div className="p-6 text-center text-muted-foreground">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma escala agendada.</p>
                            <Button variant="link" size="sm" onClick={() => setIsEventDialogOpen(true)}>Adicionar</Button>
                          </div>}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* PEOPLE TAB */}
          <TabsContent value="people" className="flex-1 overflow-hidden flex flex-col h-full m-0 p-0">
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto lg:overflow-hidden pb-4">
              {/* Pipeline Column */}
              <div className="flex-1 flex flex-col bg-muted/20 border rounded-lg overflow-hidden min-h-0">
                <div className="p-3 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-semibold flex justify-between shrink-0">
                  <span>Aguardando Contato</span>
                  <Badge variant="secondary">{pendingCount}</Badge>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {pipeline.filter(p => p.pipeline_status === 'aguardando').map(p => (
                      <Card key={p.id} onClick={() => navigate(`/acompanhamento?personId=${p.id}`)} className="cursor-pointer hover:border-yellow-400 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex justify-between">
                            <div className="font-medium text-sm">{p.full_name}</div>
                            <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Visitou: {new Date(p.last_visit_date || p.created_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pendingCount === 0 && <p className="text-center text-sm text-muted-foreground py-4">Tudo em dia!</p>}
                  </div>
                </ScrollArea>
              </div>

              {/* Active Members Column */}
              <div className="flex-1 flex flex-col bg-muted/20 border rounded-lg overflow-hidden min-h-0">
                <div className="p-3 bg-blue-500/10 border-b border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold flex justify-between shrink-0">
                  <span>Em Acompanhamento</span>
                  <Badge variant="secondary">{adoptionCount}</Badge>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {pipeline.filter(p => p.pipeline_status === 'em_andamento').map(p => (
                      <Card key={p.id} onClick={() => navigate(`/acompanhamento?personId=${p.id}`)} className="cursor-pointer hover:border-blue-400 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex justify-between">
                            <div className="font-medium text-sm">{p.full_name}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Último contato: {p.last_contact ? new Date(p.last_contact).toLocaleDateString() : '-'}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Member List */}
              <div className="flex-1 flex flex-col bg-muted/20 border rounded-lg overflow-hidden min-h-[300px] lg:min-h-0">
                <div className="p-3 bg-card border-b font-semibold flex justify-between shrink-0">
                  <span>Membros</span>
                  <Badge variant="secondary">{members.length}</Badge>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-1">
                    {members.map(p => (
                      <div key={p.id} onClick={() => navigate(`/acompanhamento?personId=${p.id}`)} className="p-2 hover:bg-muted rounded-md cursor-pointer flex justify-between items-center text-sm">
                        <span className="truncate mr-2">{p.full_name}</span>
                        <ChevronLeft className="h-3 w-3 rotate-180 opacity-50 shrink-0" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* SCALES TAB */}
          <TabsContent value="scales" className="h-full m-0 p-0">
            <ScrollArea className="h-full pr-4 pb-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Eventos & Escalas</h3>
                  <Button size="sm" onClick={() => setIsEventDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Evento</Button>
                </div>

                {events.length === 0 ? (
                  <Card className="border-dashed flex flex-col items-center justify-center p-10 text-muted-foreground">
                    <Calendar className="h-10 w-10 mb-4 opacity-20" />
                    <p>Nenhuma escala ou evento cadastrado.</p>
                    <Button variant="link" onClick={() => setIsEventDialogOpen(true)}>Criar primeiro evento</Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => (
                      <Card key={event.id} className="group relative hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="mb-2">{new Date(event.date).toLocaleDateString()}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                              <Plus className="h-3 w-3 rotate-45" />
                            </Button>
                          </div>
                          <CardTitle className="text-base">{event.title}</CardTitle>
                          <CardDescription>{event.time}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {event.description && <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{event.description}</p>}
                          {event.leader_in_charge && (
                            <div className="text-xs font-medium flex items-center gap-1 bg-secondary/50 p-1 px-2 rounded w-fit">
                              <UserPlus className="h-3 w-3" />
                              {event.leader_in_charge}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {/* Create Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Evento / Escala</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>sem título</Label>
              <Input placeholder="Ex: Ensaio Geral, Culto de Jovens" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Líder Responsável</Label>
              <Input placeholder="Quem está à frente?" value={newEvent.leader} onChange={e => setNewEvent({ ...newEvent, leader: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Escalar Membros</Label>
              <ScrollArea className="h-[150px] border rounded-md p-2">
                <div className="space-y-2">
                  {members.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum membro disponível.</p> :
                    members.map(member => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`member-${member.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={newEvent.selectedMembers.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                        />
                        <label
                          htmlFor={`member-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {member.full_name}
                        </label>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">{newEvent.selectedMembers.length} selecionados</p>
            </div>

            <div className="space-y-2">
              <Label>Descrição / Observações</Label>
              <Textarea placeholder="Detalhes da escala..." value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleCreateEvent}>Salvar Escala</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// --- Main Page Component ---

export default function Ministerios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ministerios, setMinisterios] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Selection States
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [ministryToDelete, setMinistryToDelete] = useState<Ministry | null>(null);
  const [newMinistry, setNewMinistry] = useState({ name: '', leader: '', description: '' });
  const [editMinistry, setEditMinistry] = useState({ name: '', leader: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard Data States
  const [viewMode, setViewMode] = useState<string>('overview');
  const [recentPeople, setRecentPeople] = useState<RecentPerson[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [ministryPipeline, setMinistryPipeline] = useState<MinistryPerson[]>([]);
  const [ministryMembers, setMinistryMembers] = useState<Person[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMinisterios();
    fetchRecentPeople();
  }, []);

  // When viewMode changes (select a ministry), fetch its specific data
  useEffect(() => {
    if (viewMode !== 'overview') {
      const ministry = ministerios.find(m => m.id === viewMode);
      if (ministry) {
        setSelectedMinistry(ministry); // Keep track for dashboard
        fetchMinistryData(ministry);
      }
    } else {
      setSelectedMinistry(null);
    }
  }, [viewMode, ministerios]);

  const fetchMinistryData = async (ministry: Ministry) => {
    // Fetch Pipeline (Visitors)
    fetchMinistryPipeline(ministry);
    // Fetch Members
    fetchMinistryMembers(ministry);
  };

  const fetchMinistryMembers = async (ministry: Ministry) => {
    try {
      const lowerName = ministry.name.toLowerCase();
      let query = supabase.from('people').select('*'); // Select all fields for dashboard use

      if (lowerName.includes('mulheres')) {
        query = query.or(`ministries.cs.{${ministry.name}},ministries.cs.{Ministério de Mulheres},gender.eq.feminino`);
      } else if (lowerName.includes('homens')) {
        query = query.or(`ministries.cs.{${ministry.name}},ministries.cs.{Ministério de Homens},gender.eq.masculino`);
      } else {
        query = query.contains('ministries', [ministry.name]);
      }

      // Filter for members logic if needed, but usually we want everyone assigned
      const { data, error } = await query;
      if (error) throw error;

      // Filter strictly for members vs visitors logic if desired, or just pass all 'assigned' people
      // Usually 'Members' tab shows actual members
      setMinistryMembers((data || []).filter((p: any) => p.type === 'membro' || p.type === 'convertido'));

    } catch (error) {
      console.error("Error fetching members", error);
    }
  };

  const fetchRecentPeople = async () => {
    setLoadingRecent(true);
    try {
      const date30DaysAgo = new Date();
      date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
      const dateStr = date30DaysAgo.toISOString();

      const { data: peopleData, error: peopleError } = await supabase
        .from('people' as any)
        .select('*')
        .or(`created_at.gte.${dateStr},integration_date.gte.${dateStr},conversion_date.gte.${dateStr},last_visit_date.gte.${dateStr}`)
        .order('last_visit_date', { ascending: false });

      if (peopleError) throw peopleError;

      const { data: accData } = await supabase.from('accompaniments' as any).select('*').in('person_id', (peopleData || []).map(p => p.id));

      const peopleWithStatus = (peopleData || []).map(p => {
        const personAccs = (accData || []).filter((a: any) => a.person_id === p.id);
        personAccs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastAcc = personAccs[0];
        let status = 'Pendente';
        let feedback = '';

        if (lastAcc) {
          const lastVisit = p.last_visit_date ? new Date(p.last_visit_date) : new Date(p.created_at);
          if (new Date(lastAcc.created_at) >= lastVisit) {
            status = 'Contatado';
            feedback = lastAcc.observacoes || '';
          }
        }
        return { ...p, accompaniment_status: status, last_feedback: feedback };
      });

      setRecentPeople(peopleWithStatus as unknown as RecentPerson[]);
    } catch (error) {
      console.error('Error fetching recent people:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchMinistryPipeline = async (ministry: Ministry) => {
    // ... Reusing logic from previous implementation for complex query ...
    // Simplified for brevity in this full rewrite, ensuring core logic remains
    try {
      const lowerName = ministry.name.toLowerCase();
      let searchNames = [ministry.name];
      if (lowerName.includes('jovens')) { searchNames.push('Ministério de Jovens', 'Coc Jovens'); }
      else if (lowerName.includes('teens')) { searchNames.push('Ministério de Teens', 'Coc Teens'); }
      else if (lowerName.includes('casais')) { searchNames.push('Ministério de Casais'); }
      else if (lowerName.includes('infantil')) { searchNames.push('Ministério Infantil (Kids)'); }

      let query = supabase.from('people').select('*');

      if (lowerName.includes('mulheres')) {
        query = query.or(`ministries.cs.{${ministry.name}},ministries.cs.{Ministério de Mulheres},gender.eq.feminino`);
      } else if (lowerName.includes('homens')) {
        query = query.or(`ministries.cs.{${ministry.name}},ministries.cs.{Ministério de Homens},gender.eq.masculino`);
      } else {
        const orClause = searchNames.map(name => `ministries.cs.{${name}}`).join(',');
        query = query.or(orClause);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get Accompaniments
      const { data: accData } = await supabase.from('accompaniments').select('*');

      const processed = (data || []).map((p: any) => {
        // Calc Status
        const personAccs = (accData || []).filter((a: any) => a.person_id === p.id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastAcc = personAccs[0];
        let status = 'aguardando';
        const lastVisit = p.last_visit_date ? new Date(p.last_visit_date) : new Date(p.created_at);

        if (p.journey_stage === 'concluido' || p.type === 'membro') status = 'concluido';
        else if (lastAcc && new Date(lastAcc.created_at) >= lastVisit) status = 'em_andamento';

        return { ...p, pipeline_status: status, last_contact: lastAcc?.created_at };
      });

      setMinistryPipeline(processed);

    } catch (e) {
      console.error("Error pipeline", e);
    }
  };

  const fetchMinisterios = async () => {
    try {
      const { data, error } = await supabase.from('ministries').select('*').order('name');
      if (error) throw error;
      setMinisterios(data as unknown as Ministry[]);
    } catch (error) {
      toast.error('Erro ao carregar ministérios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMinistry = async () => {
    if (!newMinistry.name) return toast.error("Nome obrigatório");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ministries').insert([{ name: newMinistry.name, leader: newMinistry.leader, description: newMinistry.description }]);
      if (error) throw error;
      toast.success("Ministério criado!");
      setIsDialogOpen(false);
      setNewMinistry({ name: '', leader: '', description: '' });
      fetchMinisterios();
    } catch (e) { toast.error("Erro ao criar"); }
    finally { setIsSubmitting(false); }
  };

  const handleEditMinistry = async () => {
    if (!editMinistry.name || !selectedMinistry) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ministries').update({ name: editMinistry.name, leader: editMinistry.leader, description: editMinistry.description }).eq('id', selectedMinistry.id);
      if (error) throw error;
      toast.success("Atualizado!");
      setIsEditDialogOpen(false);
      fetchMinisterios();
    } catch (e) { toast.error("Erro ao atualizar"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteMinistry = async () => {
    if (!ministryToDelete) return;
    try {
      const { error } = await supabase.from('ministries').delete().eq('id', ministryToDelete.id);
      if (error) throw error;
      toast.success("Removido!");
      setIsDeleteAlertOpen(false);
      fetchMinisterios();
    } catch (e) { toast.error("Erro ao remover"); }
  };

  // --- RENDER ---

  const filteredMinisterios = ministerios.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <DashboardLayout title="Ministérios">
      <div className="animate-fade-in flex flex-col h-[calc(100vh-8rem)]">

        {/* VIEW MODE: OVERVIEW (List of Ministries) */}
        {viewMode === 'overview' && (
          <div className="space-y-6 flex-col flex h-full">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 w-full sm:max-w-md">
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
                  <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Novo Ministério</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Ministério</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nome</Label><Input value={newMinistry.name} onChange={e => setNewMinistry({ ...newMinistry, name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Líder</Label><Input value={newMinistry.leader} onChange={e => setNewMinistry({ ...newMinistry, leader: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Descrição</Label><Textarea value={newMinistry.description} onChange={e => setNewMinistry({ ...newMinistry, description: e.target.value })} /></div>
                    <Button className="w-full" onClick={handleCreateMinistry} disabled={isSubmitting}>Criar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                {/* Integration Panel reuse logic if needed, but skipped to focus on Main Ministry Cards */}
                {/* New "Ministry Cards" with Dashboard preview */}
                {filteredMinisterios.map(ministry => (
                  <Card key={ministry.id} className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-primary/50 hover:border-l-primary" onClick={() => setViewMode(ministry.id)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{ministry.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setViewMode(ministry.id); }}>Abrir Painel</DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setSelectedMinistry(ministry); setEditMinistry({ name: ministry.name, leader: ministry.leader || '', description: ministry.description || '' }); setIsEditDialogOpen(true); }}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); setMinistryToDelete(ministry); setIsDeleteAlertOpen(true); }}>Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-1">{ministry.description || 'Sem descrição'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1"><Users className="h-4 w-4" /> <span>Membros</span></div>
                        <div className="flex items-center gap-1"><UserPlus className="h-4 w-4" /> <span>{ministry.leader || 'Sem líder'}</span></div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <span className="text-xs font-semibold text-primary flex items-center group-hover:underline">
                          Acessar Dashboard <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* VIEW MODE: DASHBOARD (Detailed View) */}
        {viewMode !== 'overview' && selectedMinistry && (
          <MinistryDashboard
            ministry={selectedMinistry}
            onBack={() => setViewMode('overview')}
            pipeline={ministryPipeline}
            members={ministryMembers}
            onRefreshPipeline={() => fetchMinistryPipeline(selectedMinistry)}
          />
        )}

        {/* Edit Dialog (Global) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Ministério</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={editMinistry.name} onChange={e => setEditMinistry({ ...editMinistry, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Líder</Label><Input value={editMinistry.leader} onChange={e => setEditMinistry({ ...editMinistry, leader: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={editMinistry.description} onChange={e => setEditMinistry({ ...editMinistry, description: e.target.value })} /></div>
              <Button className="w-full" onClick={handleEditMinistry} disabled={isSubmitting}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Ministério?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação é irreversível.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMinistry} className="bg-destructive">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
}
