import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserPlus, Heart, Activity, CheckCircle2, AlertCircle, Clock, ChevronRight, TrendingUp, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Person, Accompaniment } from '@/types/database';
import { Separator } from '@/components/ui/separator';

interface PastoralStats {
    totalVisitors: number;
    totalMembers: number;
    needingContact: number;
    contactedThisWeek: number;
}

interface MinistryMetric {
    id: string;
    name: string;
    leader: string;
    pendingCount: number;
    avgResponseTimeDays: number | null;
    totalAssigned: number;
}

export default function Pastoral() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PastoralStats>({
        totalVisitors: 0,
        totalMembers: 0,
        needingContact: 0,
        contactedThisWeek: 0,
    });
    const [recentFeedbacks, setRecentFeedbacks] = useState<any[]>([]);
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [ministryMetrics, setMinistryMetrics] = useState<MinistryMetric[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Ministries
            const { data: ministries } = await supabase.from('ministries').select('*').order('name');

            // 2. Fetch People Stats
            const { data: people, error: peopleError } = await supabase
                .from('people')
                .select('id, type, created_at, full_name, phone, last_visit_date, journey_stage, visitor_wants_contact, gender, ministries, conversion_date');

            if (peopleError) throw peopleError;

            // 3. Fetch Accompaniments for Feed & Calcs
            const { data: accompaniments, error: accError } = await supabase
                .from('accompaniments')
                .select(`
                  *,
                  person:people(full_name, type)
                `)
                .order('created_at', { ascending: false });

            if (accError) throw accError;

            // --- PROCESSING ---

            // Process Stats
            const visitors = people?.filter((p: any) => p.type === 'visitante' || p.type === 'convertido') || [];
            const members = people?.filter((p: any) => p.type === 'membro') || [];

            // Process Pipeline Status
            const processedPipeline = people?.map((p: any) => {
                const pAccs = accompaniments?.filter((a: any) => a.person_id === p.id) || [];
                // Sort descending
                pAccs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const lastAcc = pAccs[0];

                let status = 'aguardando';
                const lastVisit = p.last_visit_date ? new Date(p.last_visit_date) : new Date(p.created_at);

                if (p.journey_stage === 'concluido' || p.type === 'membro') {
                    status = 'concluido';
                } else if (lastAcc) {
                    const lastContact = new Date(lastAcc.created_at);
                    if (lastContact >= lastVisit) {
                        status = 'em_andamento';
                    } else {
                        status = 'aguardando';
                    }
                } else {
                    status = 'aguardando';
                }
                return { ...p, pipeline_status: status, last_contact: lastAcc?.created_at, first_contact: pAccs[pAccs.length - 1]?.created_at };
            }) || [];

            setPipeline(processedPipeline);

            // Process Ministry Metrics
            const metrics: MinistryMetric[] = (ministries || []).map((m: any) => {
                const lowerName = m.name.toLowerCase();
                const assignedPeople = processedPipeline.filter(p => {
                    // Logic from Ministerios.tsx
                    const pMinistries = p.ministries || [];
                    let isAssigned = false;

                    // Direct match or variation match
                    const hasMinistry = (name: string) => pMinistries.includes(name);

                    if (lowerName.includes('jovens')) {
                        if (hasMinistry(m.name) || hasMinistry('Ministério de Jovens') || hasMinistry('Coc Jovens')) isAssigned = true;
                    } else if (lowerName.includes('teens')) {
                        if (hasMinistry(m.name) || hasMinistry('Ministério de Teens') || hasMinistry('Coc Teens')) isAssigned = true;
                    } else if (lowerName.includes('casais')) {
                        if (hasMinistry(m.name) || hasMinistry('Ministério de Casais')) isAssigned = true;
                    } else if (lowerName.includes('infantil') || lowerName.includes('kids')) {
                        if (hasMinistry(m.name) || hasMinistry('Ministério Infantil (Kids)')) isAssigned = true;
                    } else if (lowerName.includes('mulheres')) {
                        if (hasMinistry(m.name) || hasMinistry('Ministério de Mulheres') || p.gender === 'feminino') isAssigned = true;
                    } else if (lowerName.includes('homens')) {
                        if (hasMinistry(m.name) || hasMinistry('Ministério de Homens') || p.gender === 'masculino') isAssigned = true;
                    } else {
                        if (hasMinistry(m.name)) isAssigned = true;
                    }

                    return isAssigned;
                });

                // Calculate Pending
                const pendingCount = assignedPeople.filter(p => p.pipeline_status === 'aguardando').length;

                // Calculate Avg Response Time
                // Filter people who HAVE been contacted
                const contactedPeople = assignedPeople.filter(p => p.first_contact);
                let totalResponseTime = 0;
                let countForAvg = 0;

                contactedPeople.forEach(p => {
                    const start = new Date(p.created_at).getTime(); // Or last_visit_date if we want to be stricter about "trips"
                    const end = new Date(p.first_contact).getTime();
                    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
                    if (diffDays >= 0) { // Ssanity check
                        totalResponseTime += diffDays;
                        countForAvg++;
                    }
                });

                return {
                    id: m.id,
                    name: m.name,
                    leader: m.leader || 'N/A',
                    pendingCount,
                    totalAssigned: assignedPeople.length,
                    avgResponseTimeDays: countForAvg > 0 ? Number((totalResponseTime / countForAvg).toFixed(1)) : null
                };
            }).filter(m => m.totalAssigned > 0); // Only show relevant ministries

            // Sort by pending count desc
            metrics.sort((a, b) => b.pendingCount - a.pendingCount);

            setMinistryMetrics(metrics);

            setStats({
                totalVisitors: visitors.length,
                totalMembers: members.length,
                needingContact: processedPipeline.filter(p => p.pipeline_status === 'aguardando' && (p.type === 'visitante' || p.type === 'convertido')).length,
                contactedThisWeek: accompaniments?.filter((a: any) => {
                    const date = new Date(a.created_at);
                    const now = new Date();
                    const oneWeek = 7 * 24 * 60 * 60 * 1000;
                    return (now.getTime() - date.getTime()) < oneWeek;
                }).length || 0,
            });

            setRecentFeedbacks(accompaniments?.slice(0, 20) || []);

        } catch (error) {
            console.error('Error fetching pastoral data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <DashboardLayout title="Área Pastoral">
            <div className="space-y-8 animate-fade-in p-2">

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Membros</p>
                                <div className="text-3xl font-bold text-foreground">{stats.totalMembers}</div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Visitantes</p>
                                <div className="text-3xl font-bold text-foreground">{stats.totalVisitors}</div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <UserPlus className="h-6 w-6 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Precisam de Contato</p>
                                <div className="text-3xl font-bold text-foreground">{stats.needingContact}</div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Contatos (7 dias)</p>
                                <div className="text-3xl font-bold text-foreground">{stats.contactedThisWeek}</div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* NEW: Survey Results Access */}
                    <Card
                        onClick={() => navigate('/pastoral/resultados-avaliacao')}
                        className="group hover:shadow-xl transition-all duration-500 cursor-pointer border-l-4 border-l-primary bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden"
                    >
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div className="z-10">
                                <p className="text-sm font-bold text-primary mb-1 uppercase tracking-wider">Dash de Reação</p>
                                <div className="text-xl font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                    Resultados <ChevronRight className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform z-10">
                                <Sparkles className="h-7 w-7" />
                            </div>
                            {/* Decorative background icon */}
                            <Heart className="absolute -bottom-4 -right-4 h-24 w-24 text-primary/5 -rotate-12 transition-transform group-hover:scale-110" />
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Section */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Desempenho por Ministério
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {ministryMetrics.map(metric => (
                            <Card key={metric.id} className="relative overflow-hidden hover:shadow-md transition-all">
                                <div className={`absolute top-0 left-0 w-1 h-full ${metric.pendingCount > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                <CardContent className="p-4 pl-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate" title={metric.name}>{metric.name}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <User className="h-3 w-3" /> {metric.leader}
                                            </p>
                                        </div>
                                        {metric.pendingCount > 0 ? (
                                            <Badge variant="destructive" className="ml-2 whitespace-nowrap">{metric.pendingCount} Pendentes</Badge>
                                        ) : (
                                            <Badge variant="outline" className="ml-2 border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20">Em dia</Badge>
                                        )}
                                    </div>

                                    <Separator className="my-3" />

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Tempo Médio Resposta:</span>
                                        <span className={`font-mono font-medium ${metric.avgResponseTimeDays !== null && metric.avgResponseTimeDays > 3 ? 'text-orange-500' : 'text-green-600'}`}>
                                            {metric.avgResponseTimeDays !== null ? `${metric.avgResponseTimeDays} dias` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-muted-foreground">Total Atribuídos:</span>
                                        <span className="font-mono">{metric.totalAssigned}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Global Pipeline */}
                    <Card className="lg:col-span-2 flex flex-col shadow-lg border-muted/40 h-[600px]">
                        <CardHeader className="pb-3 border-b flex-none">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Activity className="h-5 w-5 text-primary" />
                                Pipeline Geral de Visitantes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-4 bg-muted/10 min-h-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-0">
                                {/* Column 1: Aguardando */}
                                <div className="flex flex-col bg-muted/30 rounded-xl p-2 border border-border/50 h-full max-h-full overflow-hidden">
                                    <div className="flex items-center justify-between p-3 mb-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg border border-yellow-500/20 flex-none">
                                        <span className="font-semibold text-sm">Aguardando</span>
                                        <Badge variant="secondary" className="bg-background text-foreground shadow-sm">{pipeline.filter(p => p.pipeline_status === 'aguardando').length}</Badge>
                                    </div>
                                    <ScrollArea className="flex-1 pr-3 -mr-2">
                                        <div className="space-y-3 pb-2 pr-1">
                                            {pipeline.filter(p => p.pipeline_status === 'aguardando').map(p => (
                                                <div key={p.id}
                                                    onClick={() => navigate(`/acompanhamento?personId=${p.id}`)}
                                                    className="group p-4 bg-card rounded-lg shadow-sm border border-border hover:border-yellow-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                                                    <div className="pl-2">
                                                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.full_name}</p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                {p.phone}
                                                            </span>
                                                            <Badge variant="outline" className="text-[10px] h-5 px-2 bg-secondary/50">{p.type}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Column 2: Em Acompanhamento */}
                                <div className="flex flex-col bg-muted/30 rounded-xl p-2 border border-border/50 h-full max-h-full overflow-hidden">
                                    <div className="flex items-center justify-between p-3 mb-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/20 flex-none">
                                        <span className="font-semibold text-sm">Em Acompanhamento</span>
                                        <Badge variant="secondary" className="bg-background text-foreground shadow-sm">{pipeline.filter(p => p.pipeline_status === 'em_andamento').length}</Badge>
                                    </div>
                                    <ScrollArea className="flex-1 pr-3 -mr-2">
                                        <div className="space-y-3 pb-2 pr-1">
                                            {pipeline.filter(p => p.pipeline_status === 'em_andamento').map(p => (
                                                <div key={p.id}
                                                    onClick={() => navigate(`/acompanhamento?personId=${p.id}`)}
                                                    className="group p-4 bg-card rounded-lg shadow-sm border border-border hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                                                    <div className="pl-2">
                                                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.full_name}</p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-xs text-muted-foreground">
                                                                Último: {p.last_contact ? new Date(p.last_contact).toLocaleDateString() : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Column 3: Concluído */}
                                <div className="flex flex-col bg-muted/30 rounded-xl p-2 border border-border/50 h-full max-h-full overflow-hidden">
                                    <div className="flex items-center justify-between p-3 mb-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20 flex-none">
                                        <span className="font-semibold text-sm">Concluídos/Membros</span>
                                        <Badge variant="secondary" className="bg-background text-foreground shadow-sm">{pipeline.filter(p => p.pipeline_status === 'concluido').length}</Badge>
                                    </div>
                                    <ScrollArea className="flex-1 pr-3 -mr-2">
                                        <div className="space-y-3 pb-2 pr-1">
                                            {pipeline.filter(p => p.pipeline_status === 'concluido').map(p => (
                                                <div key={p.id}
                                                    onClick={() => navigate(`/acompanhamento?personId=${p.id}`)}
                                                    className="group p-4 bg-card rounded-lg shadow-sm border border-border hover:border-green-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden opacity-90 hover:opacity-100">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400"></div>
                                                    <div className="pl-2">
                                                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.full_name}</p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                <span>Concluído</span>
                                                            </div>
                                                            <Badge variant="outline" className="text-[10px] h-5 px-2 bg-secondary/50">{p.type}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity Feed - Improved & Scroll fix */}
                    <Card className="flex flex-col shadow-lg border-muted/40 h-[600px]">
                        <CardHeader className="pb-3 border-b bg-card flex-none">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5 text-primary" />
                                Atividades Recentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
                            <ScrollArea className="h-full">
                                <div className="p-6">
                                    <div className="relative border-l border-border space-y-8 pl-6 ml-2">
                                        {recentFeedbacks.map(item => (
                                            <div key={item.id} className="relative group">
                                                {/* Timeline Dot */}
                                                <div className="absolute -left-[33px] mt-1 h-3 w-3 rounded-full border border-primary bg-background group-hover:bg-primary transition-colors shadow-sm"></div>

                                                <div className="space-y-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                                        <p className="text-sm font-medium">
                                                            Contato com <span className="text-primary font-bold hover:underline cursor-pointer" onClick={() => navigate(`/acompanhamento?personId=${item.person_id}`)}>{item.person?.full_name || 'Desconhecido'}</span>
                                                        </p>
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {new Date(item.created_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} • {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] h-5 px-2 font-normal border-primary/20 text-primary">
                                                            {item.type}
                                                        </Badge>
                                                        {item.status === 'concluido' && (
                                                            <Badge variant="secondary" className="text-[10px] h-5 px-2 font-normal bg-green-500/10 text-green-600 dark:text-green-400">
                                                                Concluído
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {item.observacoes && (
                                                        <div className="text-sm text-foreground/80 bg-muted/40 p-3 rounded-md border border-border/50 italic leading-relaxed">
                                                            "{item.observacoes}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </DashboardLayout>
    );
}
