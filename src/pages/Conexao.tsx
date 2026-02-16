import { useState, useEffect } from 'react';
import {
    Puzzle,
    Users,
    Baby,
    BookOpen,
    Heart,
    Info,
    Calendar,
    Search,
    CheckCircle2,
    ExternalLink,
    MapPin,
    ClipboardCheck
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { useNavigate } from 'react-router-dom';

export default function Conexao() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visitors, setVisitors] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'families' | 'converts'>('all');

    const handleDateChange = (start: string, end: string) => {
        fetchData(start, end);
    };

    const fetchData = async (start: string, end: string) => {
        setLoading(true);
        try {
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
                .lte('created_at', `${end}T23:59:59`)
                .order('created_at', { ascending: false });

            if (peopleError) throw peopleError;
            setVisitors(peopleData || []);
        } catch (error) {
            console.error('Erro ao buscar dados na Conexão:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVisitors = visitors.filter(v => {
        const matchesSearch = v.full_name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (activeFilter === 'families') return (v.children?.length || 0) > 0;
        if (activeFilter === 'converts') return v.conversion_date != null;
        return true;
    });

    return (
        <DashboardLayout title="Conexão">
            <div className="space-y-8 animate-fade-in p-1">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Puzzle className="h-6 w-6 text-primary" />
                            Área de Conexão
                        </h2>
                        <p className="text-muted-foreground">Gestão de experiência e acompanhamento personalizado.</p>
                    </div>
                </div>

                <div className="w-full">
                    <MonthYearPicker onDateChange={handleDateChange} />
                </div>

                {/* Action Filters */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={activeFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-xl px-4"
                        onClick={() => setActiveFilter('all')}
                    >
                        Todos os Visitantes
                    </Button>
                    <Button
                        variant={activeFilter === 'families' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-xl px-4 border-orange-500/20 text-orange-600 hover:bg-orange-500/10"
                        onClick={() => setActiveFilter('families')}
                    >
                        <Baby className="h-4 w-4 mr-2" />
                        Famílias com Filhos
                    </Button>
                    <Button
                        variant={activeFilter === 'converts' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-xl px-4 border-red-500/20 text-red-600 hover:bg-red-500/10"
                        onClick={() => setActiveFilter('converts')}
                    >
                        <Heart className="h-4 w-4 mr-2" />
                        Novos Convertidos
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Visitor Follow-up Queue */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5 text-primary" />
                                Fila de Acompanhamento
                            </h3>
                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filtrar por nome..."
                                    className="pl-9 h-9 rounded-xl text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Card className="overflow-hidden border-border/40">
                            <ScrollArea className="h-[500px]">
                                <div className="divide-y divide-border/40">
                                    {loading ? (
                                        <div className="p-8 text-center text-muted-foreground">Carregando fila...</div>
                                    ) : filteredVisitors.length === 0 ? (
                                        <div className="p-12 text-center space-y-3">
                                            <div className="bg-secondary/20 h-12 w-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <p className="text-muted-foreground text-sm">Nenhum visitante encontrado para este perfil.</p>
                                        </div>
                                    ) : (
                                        filteredVisitors.map((v) => (
                                            <div key={v.id} className="p-5 hover:bg-secondary/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-black text-base tracking-tight">{v.full_name}</span>
                                                        {(v.children?.length || 0) > 0 && (
                                                            <Badge variant="outline" className="text-[10px] h-4 border-orange-500/30 bg-orange-500/5 text-orange-600 uppercase">Família</Badge>
                                                        )}
                                                        {v.conversion_date && (
                                                            <Badge variant="outline" className="text-[10px] h-4 border-red-500/30 bg-red-500/5 text-red-600 uppercase">Novo Convertido</Badge>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-primary/60" />
                                                            <span className="truncate">{v.address || "Endereço não informado"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Baby className="h-3.5 w-3.5 text-orange-500/60" />
                                                            <span>{v.children?.length || 0} filhos</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                            <span>{v.visitor_wants_discipleship ? "Deseja Discipulado" : "Visita simples"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 shrink-0">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="rounded-xl h-8 px-3 text-xs font-bold"
                                                        onClick={() => navigate('/acompanhamento')}
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1.5" />
                                                        Completar Dados
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </Card>
                    </div>

                    {/* Guidelines & Manual */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Experiência de Conexão
                        </h3>

                        <div className="space-y-4">
                            <Card className="border-l-4 border-l-primary bg-primary/5">
                                <CardHeader className="p-4 pb-1">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Missão Central
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-[11px] leading-relaxed text-muted-foreground italic">
                                    "Sair do contato básico para o acolhimento profundo. A Conexão transforma um visitante em parte da família."
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl border bg-card/50 space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground/70">Checklist Conexão</h4>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2 text-[11px] text-muted-foreground">
                                            <div className="h-4 w-4 rounded-md border flex items-center justify-center shrink-0">
                                                <Heart className="h-2.5 w-2.5" />
                                            </div>
                                            Concluir formulário de endereço e perfil.
                                        </li>
                                        <li className="flex gap-2 text-[11px] text-muted-foreground">
                                            <div className="h-4 w-4 rounded-md border flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-2.5 w-2.5" />
                                            </div>
                                            Entregar folders e apresentar ministérios.
                                        </li>
                                        <li className="flex gap-2 text-[11px] text-muted-foreground">
                                            <div className="h-4 w-4 rounded-md border flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-2.5 w-2.5" />
                                            </div>
                                            Alinhar suporte com o Kids para famílias.
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary/50 to-background border space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5" />
                                        Ações de Criatividade
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 text-[10px]">
                                            <span className="font-bold text-foreground block mb-0.5">Coffee Break ☕</span>
                                            Mantenha a comunhão após o culto.
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 text-[10px]">
                                            <span className="font-bold text-foreground block mb-0.5">Mimos & Brindes 🎁</span>
                                            Crie memórias através de gestos.
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 text-[10px]">
                                            <span className="font-bold text-foreground block mb-0.5">Bíblias e Cartões 📖</span>
                                            Atenção especial aos novos convertidos.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-foreground text-background shadow-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Puzzle className="h-4 w-4 text-primary" />
                                    <span className="font-black text-sm uppercase tracking-tighter">Sinergia Real</span>
                                </div>
                                <p className="text-[11px] leading-relaxed opacity-80">
                                    Boas-Vindas insere no sistema, Conexão visualiza em tempo real. Se houver 10 crianças, a Conexão já prepara a abordagem específica enquanto os pais entram!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
