import { useState, useEffect } from 'react';
import {
    Search,
    User,
    Baby,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    QrCode,
    Printer,
    ArrowRight,
    ChevronLeft,
    X,
    Star,
    Users,
    MessageSquare,
    Activity,
    AlertTriangle,
    Apple,
    Pill
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';

interface Person {
    id: string;
    full_name: string;
    cpf: string;
    phone: string;
    type: string;
    family_id: string;
    observations?: string;
    children?: { id: string; full_name: string; birth_date: string; observations?: string }[];
}

interface Child {
    id: string;
    full_name: string;
    birth_date: string;
    parent_id: string;
    observations?: string;
}

export default function KidsCheckin() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [parents, setParents] = useState<Person[]>([]);
    const [selectedParent, setSelectedParent] = useState<Person | null>(null);
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [checkinSuccess, setCheckinSuccess] = useState(false);
    const [securityCode, setSecurityCode] = useState('');
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [obsDialogOpen, setObsDialogOpen] = useState(false);
    const [tempCategories, setTempCategories] = useState<string[]>([]);
    const [tempDescription, setTempDescription] = useState('');
    const { toast } = useToast();

    const categories = [
        { id: 'alergia', label: 'Alergia', icon: <AlertTriangle className="h-4 w-4" /> },
        { id: 'medicamento', label: 'Medicamento', icon: <Pill className="h-4 w-4" /> },
        { id: 'restricao', label: 'Restrição Alimentar', icon: <Apple className="h-4 w-4" /> },
        { id: 'cuidado', label: 'Cuidado Especial', icon: <Activity className="h-4 w-4" /> },
        { id: 'outros', label: 'Outros', icon: <MessageSquare className="h-4 w-4" /> },
    ];

    const handleSearch = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const cleanSearch = searchQuery.replace(/\D/g, '');

            // Re-fetch with a more flexible query to handle existing formatted data or name search
            const { data: people, error: fetchError } = await supabase
                .from('people')
                .select('id, full_name, cpf, phone, type, family_id, observations');

            if (fetchError) throw fetchError;

            // Simple client-side search focused on phone
            const filteredParents = (people || []).filter(p => {
                const dbPhone = p.phone?.replace(/\D/g, '');
                return dbPhone?.includes(cleanSearch);
            }).slice(0, 5);

            // Fetch children for these parents to show in the cards
            const familyIds = filteredParents.map(p => p.family_id).filter(Boolean);

            if (familyIds.length > 0) {
                const { data: allChildren, error: childrenError } = await supabase
                    .from('people')
                    .select('id, full_name, birth_date, family_id, type, observations')
                    .in('family_id', familyIds)
                    .contains('ministries', ['Ministério Infantil (Kids)']);

                if (childrenError) throw childrenError;

                const parentsWithChildren = filteredParents.map(p => ({
                    ...p,
                    children: (allChildren || [])
                        .filter(c => c.family_id === p.family_id && c.id !== p.id)
                        .map(c => ({
                            id: c.id,
                            full_name: c.full_name,
                            birth_date: c.birth_date,
                            observations: c.observations
                        }))
                }));
                setParents(parentsWithChildren);
            } else {
                setParents(filteredParents);
            }

            if (filteredParents.length === 0) {
                toast({
                    title: "Não encontrado",
                    description: "Procure a recepção para realizar seu cadastro.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectParent = async (parent: Person) => {
        setSelectedParent(parent);
        if (parent.children && parent.children.length > 0) {
            setChildren(parent.children.map(c => ({
                id: c.id,
                full_name: c.full_name,
                birth_date: c.birth_date,
                parent_id: parent.id,
                observations: c.observations || ''
            })));
            setStep(2);
        } else {
            setLoading(true);
            try {
                // Fallback fetch if somehow children are missing
                const { data, error } = await supabase
                    .from('people')
                    .select('*')
                    .eq('family_id', parent.family_id)
                    .neq('id', parent.id)
                    .contains('ministries', ['Ministério Infantil (Kids)']);

                if (error) throw error;

                const mappedChildren: Child[] = (data || []).map(p => ({
                    id: p.id,
                    full_name: p.full_name,
                    birth_date: p.birth_date,
                    parent_id: parent.id,
                    observations: p.observations || ''
                }));

                setChildren(mappedChildren);
                setStep(2);
            } catch (error) {
                console.error('Fetch children error:', error);
            } finally {
                setLoading(false);
            }
        }

        if (parent.type === 'visitante') {
            toast({
                title: "Visitante Especial!",
                description: "Ficamos felizes com sua presença. Bem-vindos ao Kids!",
            });
        }
    };

    const generateSecurityCode = () => {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    };

    const handleFinishCheckin = async () => {
        if (selectedChildren.length === 0) return;

        setLoading(true);
        const code = generateSecurityCode();
        setSecurityCode(code);

        try {
            const checkins = selectedChildren.map(childId => {
                const child = children.find(c => c.id === childId);
                return {
                    child_id: childId,
                    responsible_id: selectedParent?.id,
                    security_code: code,
                    observations: child?.observations,
                    status: 'active'
                };
            });

            const { error } = await supabase
                .from('kids_checkins' as any)
                .insert(checkins);

            if (error) throw error;

            setCheckinSuccess(true);
            setStep(3);
        } catch (error) {
            console.error('Checkin error:', error);
            toast({
                title: "Erro no Check-in",
                description: "Não foi possível completar o check-in. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const resetAll = () => {
        setStep(1);
        setSearchQuery('');
        setParents([]);
        setSelectedParent(null);
        setChildren([]);
        setSelectedChildren([]);
        setCheckinSuccess(false);
        setSecurityCode('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-0 md:p-6 overflow-hidden">
            <div className="w-full max-w-4xl h-screen md:h-auto md:min-h-[700px] shadow-sm md:rounded-sm overflow-hidden border bg-card flex flex-col">

                {/* Header - Flat & Minimal */}
                <div className="bg-primary p-10 md:p-12 text-primary-foreground flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4 uppercase">
                            <Baby className="h-8 w-8 md:h-12 md:w-12 text-primary-foreground" />
                            Kids Check-in
                        </h1>
                        <p className="text-xs uppercase tracking-widest opacity-80 mt-2 font-bold">Ministério Infantil</p>
                    </div>
                    <div className="hidden md:flex bg-primary-foreground/10 p-4 rounded-sm border border-primary-foreground/20">
                        <QrCode className="h-16 w-16" />
                    </div>
                </div>

                <div className="flex-1 p-8 md:p-14 overflow-y-auto">
                    {step === 1 && (
                        <div className="max-w-xl mx-auto space-y-10 animate-fade-in py-10">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">Vamos começar?</h2>
                                <p className="text-slate-500 text-lg">Insira seu WhatsApp</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Ex: (00) 00000-0000"
                                        className="h-20 pl-16 text-2xl font-bold rounded-sm border focus-visible:ring-1 focus-visible:ring-primary/20 bg-background"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const digits = val.replace(/\D/g, '');
                                            if (digits.length <= 11) {
                                                let masked = digits;
                                                if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                                                if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                                                setSearchQuery(masked);
                                            }
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors"
                                        >
                                            <X size={20} className="text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full h-20 text-xl font-bold uppercase tracking-widest rounded-sm transition-colors"
                                    onClick={handleSearch}
                                    disabled={loading || !searchQuery}
                                >
                                    {loading ? "BUSCANDO..." : "BUSCAR MEU REGISTRO"}
                                </Button>
                            </div>

                            {parents.length > 0 && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">Selecione seu nome na lista:</p>
                                    <div className="grid gap-4">
                                        {parents.map(p => (
                                            <Button
                                                key={p.id}
                                                variant="outline"
                                                className="w-full min-h-[100px] h-auto justify-between px-8 py-6 rounded-sm border hover:border-primary/50 transition-colors text-left group"
                                                onClick={() => handleSelectParent(p)}
                                            >
                                                <div className="flex items-center gap-6 w-full">
                                                    <div className="bg-muted p-4 rounded-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                                        <User className="h-8 w-8" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-2xl truncate uppercase tracking-tight">{p.full_name}</p>
                                                            {p.type === 'visitante' && (
                                                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-none font-bold uppercase tracking-widest px-2 rounded-sm h-5">
                                                                    VISITANTE
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {p.children && p.children.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {p.children.map(c => (
                                                                    <Badge key={c.id} variant="secondary" className="bg-muted text-muted-foreground border-none font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-sm flex items-center gap-1">
                                                                        <Baby size={12} />
                                                                        {c.full_name.split(' ')[0]}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold opacity-60">Nenhuma criança encontrada</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && selectedParent && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                            <Button
                                variant="ghost"
                                className="gap-2 -ml-2 text-slate-500 hover:text-primary hover:bg-transparent font-bold"
                                onClick={() => setStep(1)}
                            >
                                <ChevronLeft className="h-5 w-5" /> Alterar Responsável
                            </Button>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-black text-slate-800 dark:text-white">Olá, {selectedParent.full_name.split(' ')[0]}!</h2>
                                    {selectedParent.type === 'visitante' && <Star className="h-8 w-8 text-amber-500 fill-amber-500" />}
                                </div>
                                <p className="text-slate-500 text-lg">Quais crianças participarão do culto hoje?</p>
                            </div>

                            <div className="grid gap-4">
                                {children.length > 0 ? (
                                    children.map(child => (
                                        <div
                                            key={child.id}
                                            onClick={() => {
                                                setSelectedChildren(prev =>
                                                    prev.includes(child.id)
                                                        ? prev.filter(id => id !== child.id)
                                                        : [...prev, child.id]
                                                )
                                            }}
                                            className={`p-6 rounded-sm border cursor-pointer transition-all flex items-center justify-between group min-h-[7rem] ${selectedChildren.includes(child.id)
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-border/80 bg-background'
                                                }`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`p-4 rounded-sm transition-all ${selectedChildren.includes(child.id)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    <Baby className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-2xl tracking-tight uppercase">{child.full_name}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <Badge variant="secondary" className="font-bold uppercase tracking-widest text-[10px] rounded-sm">
                                                            {child.birth_date ? `${new Date().getFullYear() - new Date(child.birth_date).getFullYear()} ANOS` : 'N/I'}
                                                        </Badge>
                                                        {child.observations && (
                                                            <Badge variant="destructive" className="font-bold uppercase tracking-widest text-[10px] rounded-sm border-0">
                                                                Atenção Especial
                                                            </Badge>
                                                        )}
                                                        {selectedChildren.includes(child.id) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-6 px-3 text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10 rounded-sm flex items-center gap-1.5"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingChild(child);

                                                                    // Pre-fill temp state from existing observation logic
                                                                    const obs = child.observations || '';
                                                                    const match = obs.match(/^\[(.*?)\] (.*)$/);
                                                                    if (match) {
                                                                        const cats = match[1].split(',').map(s => s.trim());
                                                                        setTempCategories(cats);
                                                                        setTempDescription(match[2]);
                                                                    } else {
                                                                        setTempCategories([]);
                                                                        setTempDescription(obs);
                                                                    }

                                                                    setObsDialogOpen(true);
                                                                }}
                                                            >
                                                                <MessageSquare className="h-3 w-3" />
                                                                Observações
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`h-8 w-8 rounded-sm border-2 flex items-center justify-center transition-all ${selectedChildren.includes(child.id)
                                                ? 'bg-primary border-primary'
                                                : 'border-border'
                                                }`}>
                                                {selectedChildren.includes(child.id) && <CheckCircle2 className="h-5 w-5 text-white" />}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-muted p-10 rounded-sm border border-dashed text-center space-y-4">
                                        <Users className="h-16 w-16 text-muted-foreground mx-auto" />
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground">Criança não cadastrada</h3>
                                            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">Por favor, dirija-se à nossa recepção. Vamos adorar cadastrar os pequenos!</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {children.length > 0 && (
                                <Button
                                    size="lg"
                                    className="w-full h-20 text-xl font-bold uppercase tracking-widest rounded-sm mt-4 transition-all"
                                    onClick={handleFinishCheckin}
                                    disabled={selectedChildren.length === 0 || loading}
                                >
                                    {loading ? "FINALIZANDO..." : "CONFIRMAR CHECK-IN"}
                                </Button>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="max-w-xl mx-auto text-center space-y-10 animate-fade-in py-10">
                            <div className="flex flex-col items-center">
                                <div className="bg-primary/10 p-10 rounded-sm mb-8">
                                    <CheckCircle2 className="h-24 w-24 text-primary" />
                                </div>
                                <h2 className="text-5xl font-bold tracking-tight uppercase">Tudo Pronto!</h2>
                                <p className="text-muted-foreground text-sm uppercase tracking-widest mt-4 font-bold max-w-md mx-auto">Check-in concluído. O seu código é:</p>

                                <div className="mt-10 p-10 bg-muted/50 rounded-sm border">
                                    <span className="text-7xl font-black tracking-widest text-primary">{securityCode}</span>
                                </div>

                                <div className="mt-12 flex gap-4 w-full">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 h-14 rounded-sm text-xs font-bold uppercase tracking-widest"
                                        onClick={resetAll}
                                    >
                                        NOVO CHECK-IN
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="flex-1 h-14 rounded-sm text-xs font-bold uppercase tracking-widest"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="mr-3 h-5 w-5" /> IMPRIMIR
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={obsDialogOpen} onOpenChange={setObsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-sm border p-0 overflow-hidden bg-card flex flex-col max-h-[90vh] shadow-lg">
                    <div className="p-6 border-b bg-muted/30 shrink-0">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2 text-primary">
                                <MessageSquare className="h-6 w-6" />
                                <DialogTitle className="text-xl font-bold uppercase tracking-widest">Observações</DialogTitle>
                            </div>
                            <DialogDescription className="text-xs uppercase font-bold tracking-widest mt-2">
                                Para: <span className="text-foreground">{editingChild?.full_name}</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin bg-background">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sinalizar Atenção para:</label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <Button
                                        key={cat.id}
                                        type="button"
                                        variant={tempCategories.includes(cat.label) ? "default" : "outline"}
                                        className={`h-10 px-4 rounded-sm font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors ${tempCategories.includes(cat.label)
                                            ? ""
                                            : "hover:bg-muted"
                                            }`}
                                        onClick={() => {
                                            setTempCategories(prev =>
                                                prev.includes(cat.label)
                                                    ? prev.filter(c => c !== cat.label)
                                                    : [...prev, cat.label]
                                            );
                                        }}
                                    >
                                        <div className={tempCategories.includes(cat.label) ? "" : "opacity-70"}>
                                            {cat.icon}
                                        </div>
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Instruções Adicionais:</label>
                            <Textarea
                                placeholder="Descreva cuidados específicos..."
                                className="h-32 rounded-sm text-sm p-4 border focus:ring-1 focus:ring-primary/20 transition-all resize-none bg-background shadow-none"
                                value={tempDescription}
                                onChange={(e) => setTempDescription(e.target.value)}
                            />
                        </div>

                        {(tempCategories.length > 0 || tempDescription) && (
                            <button
                                onClick={() => {
                                    setTempCategories([]);
                                    setTempDescription('');
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                            >
                                Limpar Tudo
                            </button>
                        )}
                    </div>

                    <div className="p-6 border-t bg-muted/30 shrink-0">
                        <DialogFooter>
                            <Button
                                className="w-full h-12 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2"
                                onClick={() => {
                                    if (editingChild) {
                                        const finalObs = tempCategories.length > 0
                                            ? `[${tempCategories.join(', ')}] ${tempDescription}`.trim()
                                            : tempDescription.trim();

                                        setChildren(prev => prev.map(c =>
                                            c.id === editingChild.id ? { ...c, observations: finalObs } : c
                                        ));
                                        setObsDialogOpen(false);
                                        toast({
                                            title: "Observações atualizadas",
                                            description: `As informações foram salvas.`,
                                        });
                                    }
                                }}
                            >
                                Salvar <ArrowRight className="h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
