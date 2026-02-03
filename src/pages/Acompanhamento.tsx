import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, MoreHorizontal, Phone, Calendar, MessageSquare, Loader2 } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Accompaniment, Person } from '@/types/database';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pendente: 'destructive',
  em_andamento: 'secondary',
  concluido: 'default',
};

export default function Acompanhamento() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [acompanhamentos, setAcompanhamentos] = useState<Accompaniment[]>([]);
  const [loading, setLoading] = useState(true);

  // State for creating new accompaniment
  const [people, setPeople] = useState<Person[]>([]);
  const [newAccomp, setNewAccomp] = useState({
    person_id: '',
    type: '',
    observacoes: '',
    status: 'pendente'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New features state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [ministryFilter, setMinistryFilter] = useState<string>('todos');
  const [personHistory, setPersonHistory] = useState<Accompaniment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [anniversaryFilter, setAnniversaryFilter] = useState<string>('none');

  const MINISTRY_OPTIONS = [
    'Todos',
    'Ministério de Casais',
    'Ministério de Homens',
    'Ministério de Mulheres',
    'Ministério de Jovens',
    'Ministério de Teens',
    'Ministério Infantil (Kids)',
  ];

  useEffect(() => {
    fetchAcompanhamentos();
    fetchPeople();
  }, []);

  const fetchAcompanhamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('accompaniments' as any)
        .select(`
          *,
          people (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAcompanhamentos(data as unknown as Accompaniment[]);
    } catch (error) {
      console.error('Erro ao buscar acompanhamentos:', error);
      toast.error('Erro ao carregar acompanhamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeople = async () => {
    try {
      const { data } = await supabase
        .from('people' as any)
        .select('*')
        .order('full_name');
      if (data) setPeople(data as unknown as Person[]);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
    }
  };

  const handleCreate = async () => {
    if (!newAccomp.person_id || !newAccomp.type) {
      toast.error('Pessoa e tipo são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('accompaniments' as any)
        .insert([{
          person_id: newAccomp.person_id,
          type: newAccomp.type,
          observacoes: newAccomp.observacoes,
          status: newAccomp.status,
          last_contact_date: new Date().toISOString().split('T')[0]
        }] as any);

      if (error) throw error;

      toast.success('Acompanhamento registrado!');
      setIsDialogOpen(false);
      setNewAccomp({ person_id: '', type: '', observacoes: '', status: 'pendente' });
      fetchAcompanhamentos();

      // Refresh details if open
      if (selectedPerson && newAccomp.person_id === selectedPerson.id) {
        handleViewDetails(selectedPerson);
      }
    } catch (error) {
      console.error('Erro ao criar acompanhamento:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (person: Person) => {
    setSelectedPerson(person);
    setIsDetailsOpen(true);
    // Fetch specific history
    try {
      const { data: historyData } = await supabase
        .from('accompaniments' as any)
        .select('*')
        .eq('person_id', person.id)
        .order('created_at', { ascending: false });

      if (historyData) setPersonHistory(historyData as unknown as Accompaniment[]);

      // Fetch Family (if has family_id)
      if (person.family_id) {
        const { data: familyData } = await supabase
          .from('people' as any)
          .select('*')
          .eq('family_id', person.family_id)
          .neq('id', person.id); // Exclude self

        if (familyData) setFamilyMembers(familyData as unknown as Person[]);
      } else {
        setFamilyMembers([]);
      }

    } catch (e) {
      console.error("Erro ao buscar histórico/família", e);
    }
  };

  const filteredAcompanhamentos = acompanhamentos.filter((a) => {
    const matchesSearch = a.people?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter logic: Check if person's ministries overlap with selected filter
    // If filter is 'todos', show all that match search.
    // If filter is specific, show only if person has that ministry assigned in their 'ministries' array.
    if (ministryFilter === 'todos' || ministryFilter === 'Todos') return matchesSearch;

    const personMinistries = a.people?.ministries || [];
    return matchesSearch && personMinistries.includes(ministryFilter);
  });

  // Anniversary Filtering Logic
  const filteredPeople = people.filter((p) => {
    if (anniversaryFilter === 'none') return false;

    const currentMonth = new Date().getMonth(); // 0-11
    let dateToCheck = null;

    if (anniversaryFilter === 'birth' && p.birth_date) dateToCheck = new Date(p.birth_date);
    if (anniversaryFilter === 'baptism' && p.baptism_date) dateToCheck = new Date(p.baptism_date);
    if (anniversaryFilter === 'ministry' && p.integration_date) dateToCheck = new Date(p.integration_date); // Using integration date as ministry anniversary

    if (!dateToCheck) return false;

    // Fix timezone offset issues by using UTC methods if needed, simpler to just check month index matches
    // But allow simple check:
    // Note: new Date('2023-05-15') is usually UTC. getMonth() uses local time. 
    // Safe approach: Split string
    // p.birth_date is YYYY-MM-DD

    let month = -1;
    if (anniversaryFilter === 'birth' && p.birth_date) month = parseInt(p.birth_date.split('-')[1]) - 1;
    if (anniversaryFilter === 'baptism' && p.baptism_date) month = parseInt(p.baptism_date.split('-')[1]) - 1;
    if (anniversaryFilter === 'ministry' && p.integration_date) month = parseInt(p.integration_date.split('-')[1]) - 1;

    return month === currentMonth;
  });

  const pendentes = acompanhamentos.filter((a) => a.status === 'pendente').length;
  const emAndamento = acompanhamentos.filter((a) => a.status === 'em_andamento').length;

  return (
    <DashboardLayout title="Acompanhamento">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar acompanhamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={anniversaryFilter} onValueChange={(val) => { setAnniversaryFilter(val); setMinistryFilter('todos'); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Aniversariantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Histórico (Padrão)</SelectItem>
                <SelectItem value="birth">Aniv. de Vida</SelectItem>
                <SelectItem value="baptism">Aniv. de Batismo</SelectItem>
                <SelectItem value="ministry">Aniv. de Ministério</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ministryFilter} onValueChange={(val) => { setMinistryFilter(val); setAnniversaryFilter('none'); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por Ministério" />
              </SelectTrigger>
              <SelectContent>
                {MINISTRY_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Acompanhamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Acompanhamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="pessoa">Pessoa</Label>
                  <Select
                    value={newAccomp.person_id}
                    onValueChange={(val) => setNewAccomp({ ...newAccomp, person_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pessoa" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Contato</Label>
                  <Select
                    value={newAccomp.type}
                    onValueChange={(val) => setNewAccomp({ ...newAccomp, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ligação">Ligação</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Visita Pastoral">Visita Pastoral</SelectItem>
                      <SelectItem value="Presencial">Presencial na Igreja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Detalhes do acompanhamento..."
                    value={newAccomp.observacoes}
                    onChange={(e) => setNewAccomp({ ...newAccomp, observacoes: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : acompanhamentos.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{loading ? '-' : pendentes}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : emAndamento}</div>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : acompanhamentos.filter(a => a.status === 'concluido').length}</div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
        </div>

        {/* Follow-up List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Acompanhamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (

              <div className="space-y-2">
                {!loading && anniversaryFilter === 'none' && (
                  filteredAcompanhamentos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado {ministryFilter !== 'todos' ? 'neste ministério' : ''}</p>
                  ) : (
                    filteredAcompanhamentos.map((acomp) => (
                      <div
                        key={acomp.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => acomp.people && handleViewDetails(acomp.people)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                            {acomp.people?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{acomp.people?.full_name || 'Pessoa não encontrada'}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{acomp.type}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {acomp.last_contact_date ? new Date(acomp.last_contact_date).toLocaleDateString('pt-BR') : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[acomp.status] as any}>
                            {statusLabels[acomp.status]}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ))}
              </div>
            )}

            {/* Anniversary List Rendering */}
            {!loading && anniversaryFilter !== 'none' && (
              <div className="space-y-2">
                {filteredPeople.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum aniversariante encontrado neste mês.</p>
                ) : (
                  filteredPeople.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(p)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{p.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.full_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{p.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {anniversaryFilter === 'birth' && p.birth_date && new Date(p.birth_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                          {anniversaryFilter === 'baptism' && p.baptism_date && new Date(p.baptism_date).toLocaleDateString('pt-BR')}
                          {anniversaryFilter === 'ministry' && p.integration_date && new Date(p.integration_date).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}

              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual Dashboard Sheet */}
        <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedPerson?.full_name}`} />
                  <AvatarFallback>{selectedPerson?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span>{selectedPerson?.full_name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{selectedPerson?.type?.toUpperCase()}</span>
                </div>
              </SheetTitle>
            </SheetHeader>

            {selectedPerson && (
              <div className="space-y-8">
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
                    <span className="block text-2xl font-bold">{personHistory[0]?.created_at ? new Date(personHistory[0].created_at).toLocaleDateString() : '-'}</span>
                    <span className="text-xs text-muted-foreground">Último</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedPerson.phone}</span>
                  </div>
                  {selectedPerson.ministries && selectedPerson.ministries.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">ACOMPANHAMENTO SUGERIDO</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedPerson.ministries.map(m => (
                          <Badge key={m} variant="secondary">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setNewAccomp({ ...newAccomp, person_id: selectedPerson.id });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Novo Registro
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Ver Cadastro Completo
                  </Button>
                </div>

                {/* Family Members */}
                {familyMembers.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span role="img" aria-label="family">👨‍👩‍👧‍👦</span> Família ({familyMembers.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {familyMembers.map((member) => (
                        <div
                          key={member.id}
                          className="border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleViewDetails(member)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {member.type} • {member.birth_date ? new Date().getFullYear() - new Date(member.birth_date).getFullYear() : '?'} anos
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History Timeline */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Histórico
                  </h3>
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
                          <Badge className="w-fit mt-1" variant={statusColors[history.status] as any}>{statusLabels[history.status]}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout >
  );
}
