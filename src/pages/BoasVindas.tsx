import { useState, useEffect } from 'react';
import {
    HeartHandshake,
    Users,
    UserPlus,
    Baby,
    MessageSquare,
    Sparkles,
    Info,
    Calendar,
    Search,
    Filter
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { Person } from '@/types/database';

interface VisitorStats {
    total: number;
    firstTime: number;
    returning: number;
    totalChildren: number;
    wantsContact: number;
}

export default function BoasVindas() {
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visitors, setVisitors] = useState<any[]>([]);
    const [stats, setStats] = useState<VisitorStats>({
        total: 0,
        firstTime: 0,
        returning: 0,
        totalChildren: 0,
        wantsContact: 0
    });

    const handleDateChange = (start: string, end: string) => {
        fetchData(start, end);
    };

    const fetchData = async (start: string, end: string) => {
        setLoading(true);
        try {
            // Fetch visitors in the period
            const { data: peopleData, error: peopleError } = await supabase
                .from('people' as any)
                .select(`
          *,
          children (
            id,
            name,
            age
          )
        `)
                .eq('type', 'visitante')
                .gte('created_at', `${start}T00:00:00`)
                .lte('created_at', `${end}T23:59:59`);

            if (peopleError) throw peopleError;

            const people = peopleData || [];

            // Calculate stats
            const firstTime = people.filter(p => p.visitor_first_time).length;
            const returning = people.length - firstTime;
            const wantsContact = people.filter(p => p.visitor_wants_contact).length;
            const totalChildren = people.reduce((acc, p) => acc + (p.children?.length || 0), 0);

            // Fetch active check-ins to show status
            const { data: activeCheckinsData } = await supabase
                .from('kids_checkins' as any)
                .select('child_id, people:child_id(family_id)')
                .is('checkout_time', null);

            const activeFamilies = new Set(
                (activeCheckinsData as any[])?.map(c => c.people?.family_id).filter(Boolean)
            );

            setStats({
                total: people.length,
                firstTime,
                returning,
                totalChildren,
                wantsContact
            });

            setVisitors(people.map(p => ({
                ...p,
                hasActiveCheckin: activeFamilies.has(p.family_id)
            })));
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVisitors = visitors.filter(v =>
        v.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout title="Boas-Vindas">
            <div className="space-y-8 animate-fade-in p-1">

                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <HeartHandshake className="h-6 w-6 text-primary" />
                            Painel de Boas-Vindas
                        </h2>
                        <p className="text-muted-foreground">Relatório de recepção e suporte aos visitantes.</p>
                    </div>
                </div>

                <div className="w-full">
                    <MonthYearPicker onDateChange={handleDateChange} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-primary bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-bold tracking-wider">Total de Visitantes</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.total}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>Registrados no período</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 bg-green-500/5">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-bold tracking-wider">Primeira Vez</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.firstTime}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3 text-green-600" />
                                <span>Novas experiências</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 bg-orange-500/5">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-bold tracking-wider">Crianças</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.totalChildren}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Baby className="h-3 w-3 text-orange-600" />
                                <span>Preparo para Kids</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 bg-blue-500/5">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-bold tracking-wider">Solicitaram Contato</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats.wantsContact}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3 text-blue-600" />
                                <span>Aguardando conexão</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Visitors List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Visitantes do Dia/Período
                            </h3>
                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar..."
                                    className="pl-9 h-9 rounded-xl text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Card className="overflow-hidden border-border/40">
                            <ScrollArea className="h-[400px]">
                                <div className="divide-y divide-border/40">
                                    {loading ? (
                                        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                                    ) : filteredVisitors.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">Nenhum visitante encontrado.</div>
                                    ) : (
                                        filteredVisitors.map((v) => (
                                            <div key={v.id} className="p-4 hover:bg-secondary/20 transition-colors flex justify-between items-center group">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm tracking-tight">{v.full_name}</span>
                                                        {v.visitor_first_time && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 bg-green-500/10 text-green-700 border-green-500/20">1ª VEZ</Badge>
                                                        )}
                                                        {v.hasActiveCheckin && (
                                                            <Badge variant="default" className="text-[10px] h-4 bg-primary text-primary-foreground border-none">KIDS EM SALA</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Baby className="h-3 w-3" />
                                                            {v.children?.length || 0} crianças
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {v.visitor_wants_contact ? "Quer contato" : "Apenas visita"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                    Ver Detalhes
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </Card>
                    </div>

                    {/* Team Manual / Guidelines */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Manual Boas-Vindas
                        </h3>

                        <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-bold">🎯 Objetivo Principal</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs leading-relaxed text-muted-foreground">
                                    Ser a face acolhedora da igreja. Garantir que todos se sintam bem-recebidos e assistidos desde a entrada.
                                </CardContent>
                            </Card>

                            <Card className="border-border/40">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-bold">📋 Atribuições</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <ul className="space-y-2 text-xs text-muted-foreground">
                                        <li className="flex gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                            Receber e acompanhar até os assentos.
                                        </li>
                                        <li className="flex gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                            Informar banheiros e bebedouros.
                                        </li>
                                        <li className="flex gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                            Servir água e oferecer envelopes se solicitado.
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-border/40 bg-secondary/10">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-bold">🎨 Autonomia & Criatividade</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs leading-relaxed text-muted-foreground">
                                    Sinta-se livre para tematizar a recepção em cultos especiais. Utilize painéis e decorações para reforçar a identidade do culto.
                                </CardContent>
                            </Card>

                            <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="font-bold text-sm">Dica Proativa</span>
                                </div>
                                <p className="text-[11px] leading-relaxed opacity-90">
                                    Consulte a lista de visitantes ao lado para saber o número de crianças e preparar o ministério Kids com antecedência!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
