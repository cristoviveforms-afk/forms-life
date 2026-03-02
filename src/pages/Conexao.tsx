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
    ClipboardCheck,
    Check,
    Loader2
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

    const filteredGroups = getFamilyGroups(visitors).filter(group => {
        const matchesSearch = group.mainPerson.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.dependents.some(dep => dep.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;

        if (activeFilter === 'families') {
            const totalKids = (group.mainPerson.children?.length || 0) + group.dependents.filter(d => d.ministries?.includes('Ministério Infantil (Kids)')).length;
            return totalKids > 0 || group.dependents.length > 0;
        }
        if (activeFilter === 'converts') return group.mainPerson.conversion_date != null;
        return true;
    });

    return (
        <DashboardLayout title="Conexão">
            <div className="space-y-8 animate-fade-in p-1">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-light tracking-tight text-foreground flex items-center gap-2">
                            Área de Conexão
                        </h2>
                        <p className="text-sm text-muted-foreground">Gestão de experiência e acompanhamento personalizado.</p>
                    </div>
                </div>

                <div className="w-full">
                    <MonthYearPicker onDateChange={handleDateChange} />
                </div>

                {/* Action Filters */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-border/60">
                    <Button
                        variant={activeFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-sm px-4 h-9 font-medium shadow-none"
                        onClick={() => setActiveFilter('all')}
                    >
                        Todos os Visitantes
                    </Button>
                    <Button
                        variant={activeFilter === 'families' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-sm px-4 h-9 font-medium border-border/50 shadow-none text-orange-600 hover:text-orange-700 hover:bg-orange-500/10"
                        onClick={() => setActiveFilter('families')}
                    >
                        Famílias com Filhos
                    </Button>
                    <Button
                        variant={activeFilter === 'converts' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-sm px-4 h-9 font-medium border-border/50 shadow-none text-red-600 hover:text-red-700 hover:bg-red-500/10"
                        onClick={() => setActiveFilter('converts')}
                    >
                        Novos Convertidos
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Visitor Follow-up Queue */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-light text-foreground tracking-tight">
                                Fila de Acompanhamento
                            </h3>
                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome..."
                                    className="pl-9 h-10 rounded-sm bg-muted/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border-t border-border/60">
                            <ScrollArea className="h-[500px]">
                                <div className="divide-y divide-border/40">
                                    {loading ? (
                                        <div className="p-12 flex justify-center text-muted-foreground">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                                        </div>
                                    ) : filteredGroups.length === 0 ? (
                                        <div className="p-12 text-center space-y-3">
                                            <p className="text-muted-foreground text-sm">Nenhum visitante encontrado para este perfil.</p>
                                        </div>
                                    ) : (
                                        filteredGroups.map((group) => {
                                            const v = group.mainPerson;
                                            const totalKids = (v.children?.length || 0) + group.dependents.filter(d => d.ministries?.includes('Ministério Infantil (Kids)')).length;
                                            return (
                                                <div key={group.id} className="clean-list-item cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-1.5 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-semibold text-base tracking-tight text-foreground/90">{v.full_name}</span>
                                                            {group.dependents.length > 0 && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-sm">Família</span>
                                                            )}
                                                            {v.conversion_date && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 border border-red-500/30 bg-red-500/5 px-1.5 py-0.5 rounded-sm">Novo Convertido</span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="h-3.5 w-3.5 opacity-60" />
                                                                <span className="truncate">{v.address || "Endereço não informado"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Baby className="h-3.5 w-3.5 opacity-60" />
                                                                <span>{totalKids} filhos</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" />
                                                                <span>{v.visitor_wants_discipleship ? "Deseja Discipulado" : "Visita simples"}</span>
                                                            </div>
                                                        </div>
                                                        {group.dependents.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/20 w-fit">
                                                                {group.dependents.map(dep => (
                                                                    <span key={dep.id} className="text-[10px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-sm flex items-center gap-1">
                                                                        <Users className="h-3 w-3 opacity-50" /> {dep.full_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-sm h-8 px-3 text-xs font-medium"
                                                            onClick={() => navigate(`/cadastro?id=${v.id}&mode=conexao&tipo=visitante`)}
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1.5" />
                                                            Completar Cadastro
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Guidelines & Manual */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-light text-foreground flex items-center gap-2">
                            Experiência de Conexão
                        </h3>

                        <div className="space-y-4">
                            <div className="border-l-2 border-l-primary bg-primary/5 p-4 rounded-r-md">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-primary mb-1">
                                    Missão Central
                                </h4>
                                <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                                    "Sair do contato básico para o acolhimento profundo. A Conexão transforma um visitante em parte da família."
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-sm border border-border/60 bg-muted/10 space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Checklist Conexão</h4>
                                    <ul className="space-y-3">
                                        <li className="flex gap-3 items-start text-xs text-foreground/80">
                                            <Check className="h-3 w-3 mt-0.5 text-primary opacity-70" />
                                            <span>Concluir formulário de endereço e perfil detalhado.</span>
                                        </li>
                                        <li className="flex gap-3 items-start text-xs text-foreground/80">
                                            <Check className="h-3 w-3 mt-0.5 text-primary opacity-70" />
                                            <span>Entregar folders sobre a visão da igreja e ministérios.</span>
                                        </li>
                                        <li className="flex gap-3 items-start text-xs text-foreground/80">
                                            <Check className="h-3 w-3 mt-0.5 text-primary opacity-70" />
                                            <span>Caso seja família, alinhar suporte com Voluntários Kids.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-sm border border-border/60 bg-muted/10 space-y-3 mt-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <Info className="h-3 w-3" />
                                        Ações Especiais
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex gap-3 items-start text-xs text-foreground/80">
                                            <span className="font-semibold text-primary mt-0.5">☕</span>
                                            <span className="leading-relaxed">Oferecer café e sentar-se junto após o culto.</span>
                                        </div>
                                        <div className="flex gap-3 items-start text-xs text-foreground/80">
                                            <span className="font-semibold text-primary mt-0.5">🎁</span>
                                            <span className="leading-relaxed">Mimos para 1ª visita (caneca, livro, camisa).</span>
                                        </div>
                                        <div className="flex gap-3 items-start text-xs text-foreground/80">
                                            <span className="font-semibold text-primary mt-0.5">📖</span>
                                            <span className="leading-relaxed">Atenção a quem marcou "Deseja Discipulado".</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-sm border border-primary/20 bg-primary/5 mt-6">
                                <div className="flex items-center gap-2 mb-2 text-primary">
                                    <Puzzle className="h-4 w-4" />
                                    <span className="font-bold text-[10px] uppercase tracking-widest">Sinergia com Boas Vindas</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                    Acompanhe a fila em tempo real. Identifique famílias com crianças antes da abordagem.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
