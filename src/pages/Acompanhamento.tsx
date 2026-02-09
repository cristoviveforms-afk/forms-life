```typescript
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, MessageSquare, ArrowRight, UserCheck, Phone, Calendar, Coffee } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { Accompaniment, Person } from '@/types/database';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the Journey Stages
const JOURNEY_STAGES = {
  'fase1_porta': { label: 'Fase 1: Porta / Dados Iniciais', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'fase1_conexao': { label: 'Fase 1: Sala de Conexão', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'fase2_impacto': { label: 'Fase 2: Primeiro Impacto (Semana 1)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'fase3_retorno': { label: 'Fase 3: Ciclo de Retorno', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'fase4_membresia': { label: 'Fase 4: Rumo à Membresia', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'concluido': { label: 'Concluído / Membro', color: 'bg-green-100 text-green-800 border-green-200' }
};

export default function Acompanhamento() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  
  // Dialog/Sheet states
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [personHistory, setPersonHistory] = useState<Accompaniment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('people' as any)
        .select('*')
        .or('type.eq.visitante,journey_stage.neq.concluido')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPeople(data as unknown as Person[]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar a jornada.');
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (personId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('people' as any)
        .update({ journey_stage: newStage } as any)
        .eq('id', personId);

      if (error) throw error;

      toast.success(`Fase atualizada!`);
      // Update local state to avoid full refetch flicker
      setPeople(people.map(p => p.id === personId ? { ...p, journey_stage: newStage } : p));
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
          type: 'Acompanhamento',
          observacoes: noteContent,
          status: 'concluido',
          last_contact_date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      toast.success('Observação registrada!');
      setNoteContent('');
      setIsNoteDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar observação');
    }
  };

  const handleViewDetails = async (person: Person) => {
    setSelectedPerson(person);
    setIsDetailsOpen(true);
    try {
      const { data } = await supabase
        .from('accompaniments' as any)
        .select('*')
        .eq('person_id', person.id)
        .order('created_at', { ascending: false });
      
      if (data) setPersonHistory(data as unknown as Accompaniment[]);
    } catch (e) { console.error(e); }
  };

  const filterPeople = (stage: string) => {
    return people.filter(p => {
      const pStage = p.journey_stage || (p.type === 'visitante' ? 'fase1_porta' : 'unknown');
      const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return pStage === stage && matchesSearch;
    });
  };

  const PipelineCard = ({ person }: { person: Person }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: getStageColorCode(person.journey_stage) }}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div onClick={() => handleViewDetails(person)}>
            <p className="font-semibold text-sm truncate">{person.full_name}</p>
            <p className="text-xs text-muted-foreground">{person.phone || 'Sem telefone'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSelectedPerson(person); setIsNoteDialogOpen(true); }}>
            <MessageSquare className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-[10px] px-1 h-5">
            {new Date(person.created_at || '').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
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

  const getStageColorCode = (stage?: string) => {
    switch(stage) {
      case 'fase1_porta': return '#3b82f6';
      case 'fase1_conexao': return '#6366f1';
      case 'fase2_impacto': return '#f97316';
      case 'fase3_retorno': return '#a855f7';
      case 'fase4_membresia': return '#eab308';
      default: return '#cbd5e1';
    }
  };

  const getNextStage = (current?: string) => {
    switch(current) {
        case 'fase1_porta': return 'fase1_conexao'; 
        case 'fase1_conexao': return 'fase2_impacto';
        case 'fase2_impacto': return 'fase3_retorno';
        case 'fase3_retorno': return 'fase4_membresia';
        case 'fase4_membresia': return 'concluido';
        default: return null;
    }
  };

  return (
    <DashboardLayout title="Jornada do Visitante">
      <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
        
        <div className="flex justify-between items-center px-1">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar visitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                </Avatar >
  <div className="flex flex-col">
    <span>{selectedPerson?.full_name}</span>
    <span className="text-xs font-normal text-muted-foreground">{selectedPerson?.type?.toUpperCase()}</span>
  </div>
              </SheetTitle >
            </SheetHeader >

  { selectedPerson && (
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
          </SheetContent >
        </Sheet >
      </div >
    </DashboardLayout >
  );
}
