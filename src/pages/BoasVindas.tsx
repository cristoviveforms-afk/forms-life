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
import { useNavigate } from 'react-router-dom';

interface VisitorStats {
    total: number;
    firstTime: number;
    returning: number;
    totalChildren: number;
    wantsContact: number;
}

interface FamilyGroup {
    id: string;
    mainPerson: any;
    dependents: any[];
}

const getFamilyGroups = (visitors: any[]): FamilyGroup[] => {
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


export default function BoasVindas() {
    const navigate = useNavigate();
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

            const people = (peopleData as any[]) || [];

            // Calculate stats
            const firstTime = people.filter(p => p.visitor_first_time).length;
            const returning = people.length - firstTime;
            const wantsContact = people.filter(p => p.visitor_wants_contact).length;
            const totalChildren = people.reduce((acc, p) => {
                const legacyKids = p.children?.length || 0;
                const isChild = Array.isArray(p.ministries) && p.ministries.includes('Ministério Infantil (Kids)') ? 1 : 0;
                return acc + legacyKids + isChild;
            }, 0);

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

    const filteredGroups = getFamilyGroups(visitors).filter(group => {
        const term = searchTerm.toLowerCase();
        return group.mainPerson.full_name.toLowerCase().includes(term) ||
            group.dependents.some(dep => dep.full_name.toLowerCase().includes(term));
    });

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

                {/* Stats Grid - Minimalist approach */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-4 border-b border-border/60 pb-8 mb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Total Sched.</p>
                        <div className="text-4xl font-light text-foreground">{stats.total}</div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">1ª Vez</p>
                        <div className="text-4xl font-light text-foreground">{stats.firstTime}</div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Retornos</p>
                        <div className="text-4xl font-light text-foreground">{stats.returning}</div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Kids Geral</p>
                        <div className="text-4xl font-light text-primary">{stats.totalChildren}</div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Contatos</p>
                        <div className="text-4xl font-light text-foreground">{stats.wantsContact}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Visitors List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <h3 className="text-lg font-medium tracking-tight">
                                Visitantes do Dia / Período
                            </h3>
                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar..."
                                    className="pl-9 h-9 rounded-sm text-xs bg-muted/30 border-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-hidden">
                            <ScrollArea className="h-[400px]">
                                <div className="divide-y divide-border/20">
                                    {loading ? (
                                        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                                    ) : filteredGroups.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">Nenhum visitante encontrado.</div>
                                    ) : (
                                        filteredGroups.map((group) => {
                                            const v = group.mainPerson;
                                            const totalKids = (v.children?.length || 0) + group.dependents.filter(d => d.ministries?.includes('Ministério Infantil (Kids)')).length;
                                            return (
                                                <div key={group.id} className="clean-list-item group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
                                                    <div className="space-y-1 flex-1 relative">
                                                        {group.dependents.length > 0 && <div className="family-node-line"></div>}

                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <span className="font-semibold text-base tracking-tight">{v.full_name}</span>
                                                            {v.visitor_first_time && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-primary border border-primary/30 px-1.5 py-0.5 rounded-sm">1ª Vez</span>
                                                            )}
                                                            {v.hasActiveCheckin && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">Kids na Sala</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground uppercase tracking-wider font-medium relative z-10">
                                                            {totalKids > 0 && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Baby className="h-3 w-3" />
                                                                    {totalKids} crianças
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1.5">
                                                                <MessageSquare className="h-3 w-3" />
                                                                {v.visitor_wants_contact ? "Requer contato" : "Apenas visita"}
                                                            </span>
                                                        </div>

                                                        {group.dependents.length > 0 && (
                                                            <div className="mt-3 pl-8 space-y-2 relative z-10">
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-sm h-8 mt-4 sm:mt-0 font-medium"
                                                        onClick={() => navigate(`/cadastro?id=${v.id}&mode=boas-vindas&tipo=visitante`)}
                                                    >
                                                        Visualizar Cadastro
                                                    </Button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
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
