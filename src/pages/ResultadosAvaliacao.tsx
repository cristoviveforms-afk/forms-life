import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Sparkles, ChevronLeft, Star, MessageSquare, Quote, TrendingUp, Users, PieChart as PieChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const ResultadosAvaliacao: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalResponses: 0,
        avgNps: 0,
        satisfactionRate: 0,
        categories: [] as any[],
        npsData: [] as any[]
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const { data: surveys, error } = await supabase
                .from('experience_surveys')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setData(surveys || []);
            processStats(surveys || []);
        } catch (error) {
            console.error('Erro ao buscar resultados:', error);
        } finally {
            setLoading(false);
        }
    };

    const processStats = (surveys: any[]) => {
        const total = surveys.length;
        if (total === 0) return;

        // NPS Calculation
        const promoters = surveys.filter(s => s.nps_score >= 9).length;
        const detractors = surveys.filter(s => s.nps_score <= 6).length;
        const nps = Math.round(((promoters - detractors) / total) * 100);

        // Satisfaction Rate (Rating >= 4 across all categories)
        const avgRatings = surveys.reduce((acc, s) => {
            acc.reception += s.rating_reception || 0;
            acc.env += s.rating_environment || 0;
            acc.worship += s.rating_worship || 0;
            acc.arts += s.rating_arts || 0;
            acc.word += s.rating_word || 0;
            return acc;
        }, { reception: 0, env: 0, worship: 0, arts: 0, word: 0 });

        const categories = [
            { name: 'Recepção', val: (avgRatings.reception / total).toFixed(1) },
            { name: 'Ambiente', val: (avgRatings.env / total).toFixed(1) },
            { name: 'Louvor', val: (avgRatings.worship / total).toFixed(1) },
            { name: 'Artes', val: (avgRatings.arts / total).toFixed(1) },
            { name: 'Palavra', val: (avgRatings.word / total).toFixed(1) }
        ];

        const npsData = [
            { name: 'Promotores (9-10)', value: promoters, color: '#10b981' },
            { name: 'Passivos (7-8)', value: total - promoters - detractors, color: '#f59e0b' },
            { name: 'Detratores (0-6)', value: detractors, color: '#ef4444' }
        ];

        setStats({
            totalResponses: total,
            avgNps: nps,
            satisfactionRate: Math.round((promoters / total) * 100),
            categories,
            npsData
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout title="Dashboard de Reação">
            <div className="space-y-8 p-4 md:p-6 animate-fade-in bg-gradient-to-br from-background via-background to-primary/5 min-h-full">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/pastoral')} className="rounded-xl flex items-center gap-2">
                        <ChevronLeft size={18} /> Voltar para Pastoral
                    </Button>
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Sparkles size={18} /> Atualizado em tempo real
                    </div>
                </div>

                {/* Global Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border-none shadow-xl bg-card/40 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                        <CardContent className="pt-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total de Respostas</p>
                                <div className="text-4xl font-black mt-1">{stats.totalResponses}</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                                <Users size={32} className="text-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-card/40 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                        <CardContent className="pt-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">NPS Global</p>
                                <div className="text-4xl font-black mt-1 text-emerald-600">{stats.avgNps}</div>
                                <p className="text-[10px] mt-1 text-muted-foreground font-medium">De -100 a +100</p>
                            </div>
                            <div className="bg-emerald-500/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                                <TrendingUp size={32} className="text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-card/40 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                        <CardContent className="pt-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">% Promotores</p>
                                <div className="text-4xl font-black mt-1 text-blue-600">{stats.satisfactionRate}%</div>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                                <Heart size={32} className="text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Category Ratings Chart */}
                    <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b bg-primary/5 pb-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Star size={20} className="text-yellow-500 fill-yellow-500" /> Satisfação por Categoria
                            </CardTitle>
                            <CardDescription>Média de estrelas dadas pelos visitantes</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.categories} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <XAxis type="number" domain={[0, 5]} hide />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="val" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* NPS Pie Chart */}
                    <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b bg-primary/5 pb-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <PieChartIcon size={20} className="text-primary" /> Distribuição NPS
                            </CardTitle>
                            <CardDescription>Perfil de recomendação dos visitantes</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.npsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.npsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Testimonies & Suggestions Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b bg-emerald-500/5 pb-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Quote size={20} className="text-emerald-500" /> Testemunhos e Orações
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[400px]">
                            <CardContent className="pt-6 space-y-4 px-6">
                                {data.filter(s => s.testimony_prayer).map((survey) => (
                                    <div key={survey.id} className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 italic text-sm text-foreground relative">
                                        "{survey.testimony_prayer}"
                                        <div className="mt-2 text-[10px] font-bold opacity-40 uppercase text-right">
                                            {new Date(survey.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {data.filter(s => s.testimony_prayer).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground opacity-50">
                                        Nenhum testemunho registrado ainda.
                                    </div>
                                )}
                            </CardContent>
                        </ScrollArea>
                    </Card>

                    <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b bg-purple-500/5 pb-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <MessageSquare size={20} className="text-purple-500" /> Sugestões de Melhoria
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[400px]">
                            <CardContent className="pt-6 space-y-4 px-6">
                                {data.filter(s => s.suggestions).map((survey) => (
                                    <div key={survey.id} className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 text-sm text-foreground">
                                        {survey.suggestions}
                                        <div className="mt-2 text-[10px] font-bold opacity-40 uppercase text-right">
                                            {new Date(survey.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {data.filter(s => s.suggestions).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground opacity-50">
                                        Nenhuma sugestão registrada ainda.
                                    </div>
                                )}
                            </CardContent>
                        </ScrollArea>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ResultadosAvaliacao;
