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
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Save, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScaleEntry {
    id: string;
    person_id: string;
    scale_date: string;
    role: string;
    notes: string;
    person: {
        name: string;
        full_name: string;
    };
}

export function MediaScales() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scales, setScales] = useState<ScaleEntry[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    const [newScale, setNewScale] = useState({
        person_id: '',
        date: new Date(),
        role: 'Técnico',
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
          person:people(name, full_name)
        `)
                .eq('ministry_name', ministryName)
                .order('scale_date', { ascending: true });

            if (scalesError) throw scalesError;
            setScales(scalesData || []);

            // Fetch ministry members (people who have 'Mídia e Comunicação' in their ministries array)
            const { data: membersData, error: membersError } = await supabase
                .from('people')
                .select('id, full_name, name')
                .filter('ministries', 'cs', `{"${ministryName}"}`)
                .eq('type', 'membro');

            if (membersError) throw membersError;
            setMembers(membersData || []);
        } catch (error) {
            console.error('Error fetching scales:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as escalas.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
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
                role: 'Técnico',
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário de Criação */}
                <Card className="lg:col-span-1 shadow-lg border-emerald-100 overflow-hidden">
                    <CardHeader className="bg-emerald-50/50">
                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                            <UserPlus className="h-5 w-5" />
                            Escalar Voluntário
                        </CardTitle>
                        <CardDescription>Defina a data e função do membro na equipe.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Membro da Equipe</Label>
                            <Select
                                value={newScale.person_id}
                                onValueChange={(v) => setNewScale({ ...newScale, person_id: v })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Selecione um voluntário" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(member => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.full_name || member.name}
                                        </SelectItem>
                                    ))}
                                    {members.length === 0 && (
                                        <div className="p-2 text-xs text-slate-500 text-center">Nenhum membro vinculado à Mídia</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Data da Escala</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl",
                                            !newScale.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newScale.date ? format(newScale.date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={newScale.date}
                                        onSelect={(date) => date && setNewScale({ ...newScale, date })}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Função / Cargo</Label>
                            <Select
                                value={newScale.role}
                                onValueChange={(v) => setNewScale({ ...newScale, role: v })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                                <SelectContent>
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

                        <div className="space-y-2">
                            <Label>Observações (Opcional)</Label>
                            <Textarea
                                placeholder="Ex: Culto de Domingo, Evento Especial..."
                                className="rounded-xl resize-none"
                                value={newScale.notes}
                                onChange={(e) => setNewScale({ ...newScale, notes: e.target.value })}
                            />
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                            onClick={handleCreateScale}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Adicionar à Escala
                        </Button>
                    </CardContent>
                </Card>

                {/* Lista de Escalas */}
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-600" />
                            Escala de {ministryName}
                        </CardTitle>
                        <CardDescription>Escala mensal de voluntários para serviços e eventos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                                <p className="text-slate-500 text-sm">Carregando escalas...</p>
                            </div>
                        ) : scales.length > 0 ? (
                            <div className="space-y-3">
                                {scales.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-emerald-100 text-emerald-700 h-12 w-12 rounded-xl flex flex-col items-center justify-center font-bold">
                                                <span className="text-xs uppercase">{format(new Date(item.scale_date + 'T12:00:00'), 'MMM', { locale: ptBR })}</span>
                                                <span className="text-lg">{format(new Date(item.scale_date + 'T12:00:00'), 'dd')}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{item.person?.full_name || item.person?.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                                                        {item.role}
                                                    </Badge>
                                                    {item.notes && (
                                                        <span className="text-xs text-slate-500 italic">
                                                            - {item.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end mt-4 md:mt-0 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteScale(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                                <CalendarIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-slate-500 font-medium">Nenhuma escala definida</h3>
                                <p className="text-slate-400 text-sm mt-1">Use o formulário ao lado para começar.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
