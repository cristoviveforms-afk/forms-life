import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Save, UserPlus, Users, Sparkles, RefreshCw, CalendarDays, List, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';

interface ScaleEntry {
    id: string;
    person_id: string;
    scale_date: string;
    role: string;
    notes: string;
    person: {
        name: string;
        full_name: string;
    } | null;
}

interface MediaEvent {
    id: string;
    title: string;
    event_date: string;
    description?: string;
}

export function MediaScales() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [scales, setScales] = useState<ScaleEntry[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [events, setEvents] = useState<MediaEvent[]>([]);
    const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('calendario');

    const [newScale, setNewScale] = useState({
        person_id: '',
        date: new Date(),
        role: 'Técnico de Transmissão',
        notes: ''
    });

    const ministryName = 'Mídia e Comunicação';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch scales
            const { data: scalesData, error: scalesError } = await supabase
                .from('ministry_scales')
                .select(`
                    *,
                    person:people (
                        name,
                        full_name
                    )
                `)
                .eq('ministry_name', ministryName)
                .order('scale_date', { ascending: true });

            if (scalesError) throw scalesError;
            setScales(scalesData || []);

            // Fetch events to sync
            const { data: eventsData, error: eventsError } = await supabase
                .from('media_events')
                .select('id, title, event_date')
                .gte('event_date', format(new Date(), 'yyyy-MM-01'));

            if (eventsError) throw eventsError;
            setEvents(eventsData || []);

            // Fetch ministry members
            const { data: membersData, error: membersError } = await supabase
                .from('people')
                .select('id, full_name, name')
                .contains('ministries', [ministryName])
                .eq('type', 'membro');

            if (membersError) throw membersError;
            setMembers(membersData || []);
            console.error('Error fetching data:', error);
            toast({
                title: 'Erro de sincronia',
                description: 'Houve um problema ao conectar com o banco de dados. Tente atualizar a página.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncEvents = async () => {
        setSyncing(true);
        try {
            // Check which events don't have a scale yet
            const datesWithScales = new Set(scales.map(s => s.scale_date));
            const eventsToSync = events.filter(e => !datesWithScales.has(e.event_date));

            if (eventsToSync.length === 0) {
                toast({
                    title: 'Tudo em ordem!',
                    description: 'Todos os eventos já possuem escalas definidas.',
                });
                return;
            }

            toast({
                title: 'Sincronização iniciada',
                description: `Encontrados ${eventsToSync.length} eventos sem escala. Defina os voluntários para cada um.`,
            });

            // Just highlight the first one in the form
            const firstEvent = eventsToSync[0];
            setNewScale({
                ...newScale,
                date: new Date(firstEvent.event_date + 'T12:00:00'),
                notes: firstEvent.title
            });

        } catch (error) {
            toast({
                title: 'Erro na sincronia',
                description: 'Não foi possível processar os eventos.',
                variant: 'destructive',
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleCreateScale = async () => {
        if (!newScale.person_id) {
            toast({
                title: 'Atenção',
                description: 'Selecione um membro para a escala.',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('ministry_scales')
                .insert({
                    ministry_name: ministryName,
                    person_id: newScale.person_id,
                    scale_date: format(newScale.date, 'yyyy-MM-dd'),
                    role: newScale.role,
                    notes: newScale.notes
                });

            if (error) throw error;

            toast({
                title: 'Sucesso',
                description: 'Escala salva com sucesso!',
            });

            setNewScale({
                person_id: '',
                date: new Date(),
                role: 'Técnico de Transmissão',
                notes: ''
            });

            fetchData();
        } catch (error) {
            console.error('Error saving scale:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar a escala.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteScale = async (id: string) => {
        try {
            const { error } = await supabase
                .from('ministry_scales')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Escala removida',
                description: 'O agendamento foi cancelado.',
            });

            fetchData();
        } catch (error) {
            console.error('Error deleting scale:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir a escala.',
                variant: 'destructive',
            });
        }
    };

    const eventDays = events.map(e => new Date(e.event_date + 'T12:00:00'));
    const scaleDays = scales.map(s => new Date(s.scale_date + 'T12:00:00'));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Side - Compact and Premium */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="shadow-2xl border-none bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/10">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em]">
                                <Sparkles className="h-4 w-4 fill-emerald-500/20" />
                                <span>Gerenciamento</span>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                                Escalar <br />
                                <span className="text-primary tracking-normal not-italic lowercase font-serif border-b-2 border-primary/20 pb-1">Voluntário</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-0">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Voluntário</Label>
                                <Select
                                    value={newScale.person_id}
                                    onValueChange={(v) => setNewScale({ ...newScale, person_id: v })}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl bg-secondary/30 border-none focus:ring-primary/40">
                                        <SelectValue placeholder="Selecione um membro" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10">
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.full_name || member.name}
                                            </SelectItem>
                                        ))}
                                        {members.length === 0 && (
                                            <div className="p-4 text-xs text-center text-muted-foreground">
                                                Nenhum membro encontrado na Mídia.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data da Escala</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-12 justify-start text-left font-medium rounded-2xl bg-secondary/30 border-none hover:bg-secondary/50"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                                {newScale.date ? format(newScale.date, "dd 'de' MMMM", { locale: ptBR }) : <span>Selecione a data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="center">
                                            <Calendar
                                                mode="single"
                                                selected={newScale.date}
                                                onSelect={(date) => date && setNewScale({ ...newScale, date })}
                                                initialFocus
                                                locale={ptBR}
                                                className="p-3"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Função</Label>
                                    <Select
                                        value={newScale.role}
                                        onValueChange={(v) => setNewScale({ ...newScale, role: v })}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-secondary/30 border-none focus:ring-primary/40">
                                            <SelectValue placeholder="Selecione a função" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-white/10">
                                            <SelectItem value="Técnico de Transmissão">Técnico de Transmissão</SelectItem>
                                            <SelectItem value="Operador de Áudio">Operador de Áudio</SelectItem>
                                            <SelectItem value="Operador de Projeção">Operador de Projeção</SelectItem>
                                            <SelectItem value="Câmera">Câmera</SelectItem>
                                            <SelectItem value="Social Media Local">Social Media Local</SelectItem>
                                            <SelectItem value="Fotógrafo">Fotógrafo</SelectItem>
                                            <SelectItem value="Líder de Equipe">Líder de Equipe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição do Serviço</Label>
                                <Textarea
                                    placeholder="Ex: Culto de Celebração, Casamento..."
                                    className="rounded-2xl bg-secondary/30 border-none focus:ring-primary/40 min-h-[80px] resize-none"
                                    value={newScale.notes}
                                    onChange={(e) => setNewScale({ ...newScale, notes: e.target.value })}
                                />
                            </div>

                            <Button
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleCreateScale}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Salvar na Escala
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Automation Card */}
                    <Card className="shadow-xl border-none bg-primary/5 rounded-[2rem] border border-primary/10 p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <RefreshCw className={cn("h-6 w-6 text-primary", syncing && "animate-spin")} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-sm uppercase tracking-tight">Escala Automática</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Sincronize com os eventos do calendário para identificar datas sem voluntários.
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSyncEvents}
                                    className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl px-4"
                                    disabled={syncing}
                                >
                                    Sincronizar Agora
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main View Area */}
                <div className="lg:col-span-8 flex flex-col space-y-6">
                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full">
                        <div className="flex items-center justify-between mb-2">
                            <TabsList className="bg-secondary/30 p-1 rounded-2xl border-none">
                                <TabsTrigger value="calendario" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Calendário
                                </TabsTrigger>
                                <TabsTrigger value="lista" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <List className="h-4 w-4 mr-2" />
                                    Visualização Completa
                                </TabsTrigger>
                            </TabsList>
                            <Badge variant="outline" className="rounded-full border-primary/20 text-[10px] font-black tracking-widest uppercase py-1 px-4 bg-primary/5">
                                {scales.length} Voluntários Escalados
                            </Badge>
                        </div>

                        <TabsContent value="calendario" className="mt-0">
                            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/10 min-h-[600px]">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-xl font-bold">Calendário de Escala</CardTitle>
                                        <CardDescription>Visualize o preenchimento mensal através dos dias marcados.</CardDescription>
                                    </div>
                                    <div className="flex gap-4 text-xs font-bold uppercase tracking-tighter">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-sm bg-primary" />
                                            <span>Membro Escalado</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 scale-75" />
                                            <span>Evento Marcado</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col md:flex-row gap-8 pt-6 h-full">
                                    <div className="flex-1 flex items-center justify-center p-4 bg-secondary/20 rounded-[2rem]">
                                        <Calendar
                                            mode="single"
                                            selected={newScale.date}
                                            onSelect={(d) => d && setNewScale({ ...newScale, date: d })}
                                            locale={ptBR}
                                            className="scale-110"
                                            modifiers={{
                                                hasScale: scaleDays,
                                                hasEvent: eventDays,
                                                missingScale: (date) => {
                                                    const dateStr = format(date, 'yyyy-MM-dd');
                                                    const hasEvent = events.some(e => e.event_date === dateStr);
                                                    const hasScale = scales.some(s => s.scale_date === dateStr);
                                                    return hasEvent && !hasScale;
                                                }
                                            }}
                                            modifiersClassNames={{
                                                hasScale: "bg-primary/20 text-primary font-bold rounded-xl",
                                                hasEvent: "after:content-[''] after:block after:w-1 after:h-1 after:bg-emerald-500 after:rounded-full after:mx-auto after:mt-1",
                                                missingScale: "bg-red-500/10 text-red-600 ring-2 ring-red-500/20 rounded-xl"
                                            }}
                                        />
                                    </div>

                                    <div className="w-full md:w-80 space-y-4">
                                        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                                            <Users className="h-4 w-4" /> Detalhes do Dia
                                        </h4>
                                        <ScrollArea className="h-[400px]">
                                            <div className="space-y-3">
                                                {scales.filter(s => s.scale_date === format(newScale.date, 'yyyy-MM-dd')).length === 0 && (
                                                    <div className="p-8 text-center bg-secondary/10 rounded-3xl border border-dashed border-white/5 space-y-3">
                                                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
                                                        <p className="text-xs text-muted-foreground italic">
                                                            Ninguém escalado para este dia ainda.
                                                        </p>
                                                    </div>
                                                )}
                                                {scales
                                                    .filter(s => s.scale_date === format(newScale.date, 'yyyy-MM-dd'))
                                                    .map(item => (
                                                        <div key={item.id} className="p-4 rounded-2xl bg-secondary/30 border border-white/5 group relative overflow-hidden">
                                                            <div className="absolute inset-y-0 left-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform" />
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h5 className="font-bold text-sm">{item.person?.full_name || item.person?.name}</h5>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => handleDeleteScale(item.id)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary rounded-lg border-none">
                                                                {item.role}
                                                            </Badge>
                                                            {item.notes && <p className="text-[10px] text-muted-foreground mt-2 italic">{item.notes}</p>}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="lista" className="mt-0">
                            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/10">
                                <CardContent className="p-6">
                                    <ScrollArea className="h-[600px] pr-4">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                <p className="text-sm text-muted-foreground">Sincronizando dados...</p>
                                            </div>
                                        ) : scales.length > 0 ? (
                                            <div className="space-y-4">
                                                {scales.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-3xl bg-secondary/20 hover:bg-secondary/40 transition-all border border-transparent hover:border-white/10"
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-card shadow-inner border border-white/5 shrink-0">
                                                                <span className="text-[10px] font-black text-primary uppercase">{format(new Date(item.scale_date + 'T12:00:00'), 'MMM', { locale: ptBR })}</span>
                                                                <span className="text-2xl font-black">{format(new Date(item.scale_date + 'T12:00:00'), 'dd')}</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{item.person?.full_name || item.person?.name}</h4>
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="outline" className="rounded-lg border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest bg-primary/5">
                                                                        {item.role}
                                                                    </Badge>
                                                                    {item.notes && (
                                                                        <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                                                                            • {item.notes}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10"
                                                                onClick={() => handleDeleteScale(item.id)}
                                                            >
                                                                Remover
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                                <div className="p-6 rounded-[2.5rem] bg-secondary/30">
                                                    <CalendarIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-xl">Silêncio na Equipe</h3>
                                                    <p className="text-sm text-muted-foreground">Dê o primeiro passo escalando um voluntário para o próximo evento.</p>
                                                </div>
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
