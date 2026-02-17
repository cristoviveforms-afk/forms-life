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
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-0 md:p-6 overflow-hidden">
            <Card className="w-full max-w-4xl h-screen md:h-auto md:min-h-[700px] shadow-2xl md:rounded-[40px] overflow-hidden border-none flex flex-col">

                {/* Header - Vibrant & Modern */}
                <div className="bg-primary p-10 md:p-12 text-primary-foreground flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                <Baby className="h-8 w-8 md:h-12 md:w-12 text-white" />
                            </div>
                            Kids Check-in
                        </h1>
                        <p className="text-lg opacity-80 mt-2 font-medium">Seja muito bem-vindo ao nosso ministério!</p>
                    </div>
                    <div className="hidden md:flex bg-white/10 p-4 rounded-[30px] backdrop-blur-xl border border-white/20">
                        <QrCode className="h-16 w-16" />
                    </div>
                </div>

                <CardContent className="flex-1 p-8 md:p-14 overflow-y-auto">
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
                                        className="h-20 pl-16 text-2xl font-bold rounded-3xl border-2 focus:border-primary shadow-sm bg-slate-50/50 dark:bg-slate-900/50"
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
                                            className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                                        >
                                            <X size={20} className="text-slate-400" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full h-20 text-2xl font-black rounded-3xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                    onClick={handleSearch}
                                    disabled={loading || !searchQuery}
                                >
                                    {loading ? "BUSCANDO..." : "BUSCAR MEU REGISTRO"}
                                </Button>
                            </div>

                            {parents.length > 0 && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Selecione seu nome na lista:</p>
                                    <div className="grid gap-4">
                                        {parents.map(p => (
                                            <Button
                                                key={p.id}
                                                variant="outline"
                                                className="w-full min-h-[100px] h-auto justify-between px-8 py-6 rounded-3xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                                                onClick={() => handleSelectParent(p)}
                                            >
                                                <div className="flex items-center gap-6 w-full">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                                                        <User className="h-8 w-8" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-black text-2xl truncate">{p.full_name}</p>
                                                            {p.type === 'visitante' && (
                                                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-none font-black px-1.5 h-4">
                                                                    VISITANTE
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {p.children && p.children.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {p.children.map(c => (
                                                                    <Badge key={c.id} variant="secondary" className="bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-none font-bold text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                                        <Baby size={12} />
                                                                        {c.full_name.split(' ')[0]}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold opacity-60">Nenhuma criança encontrada</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4" />
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
                                            className={`p-6 rounded-[32px] border-4 cursor-pointer transition-all flex items-center justify-between group h-28 ${selectedChildren.includes(child.id)
                                                ? 'border-primary bg-primary/5'
                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                                }`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`p-4 rounded-2xl transition-all ${selectedChildren.includes(child.id)
                                                    ? 'bg-primary text-white rotate-6'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:rotate-6'
                                                    }`}>
                                                    <Baby className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-2xl">{child.full_name}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="font-black text-[10px]">
                                                            {child.birth_date ? `${new Date().getFullYear() - new Date(child.birth_date).getFullYear()} ANOS` : 'N/I'}
                                                        </Badge>
                                                        {child.observations && (
                                                            <Badge variant="destructive" className="font-black text-[10px] animate-pulse">
                                                                {child.observations}
                                                            </Badge>
                                                        )}
                                                        {selectedChildren.includes(child.id) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-3 text-[11px] font-black uppercase bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:scale-105 transition-all rounded-xl flex items-center gap-1.5 shadow-sm shadow-primary/5"
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
                                                                <MessageSquare className="h-3.5 w-3.5" />
                                                                Observações
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`h-8 w-8 rounded-full border-4 flex items-center justify-center transition-all ${selectedChildren.includes(child.id)
                                                ? 'bg-primary border-primary'
                                                : 'border-slate-200 dark:border-slate-700'
                                                }`}>
                                                {selectedChildren.includes(child.id) && <CheckCircle2 className="h-5 w-5 text-white" />}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-10 rounded-[40px] border-4 border-dashed border-amber-200 dark:border-amber-900/50 text-center space-y-4">
                                        <Users className="h-16 w-16 text-amber-500 mx-auto" />
                                        <div>
                                            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100">Criança não cadastrada</h3>
                                            <p className="text-amber-700 dark:text-amber-200 text-lg mt-2">Por favor, dirija-se à nossa recepção. Vamos adorar cadastrar os pequenos!</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {children.length > 0 && (
                                <Button
                                    size="lg"
                                    className="w-full h-24 text-3xl font-black rounded-[32px] mt-4 shadow-2xl shadow-primary/30 transition-all active:scale-[0.98]"
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
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-10 rounded-full mb-8 animate-bounce">
                                    <CheckCircle2 className="h-24 w-24 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-5xl font-black text-slate-800 dark:text-white">Tudo Pronto!</h2>
                                <p className="text-slate-500 text-2xl mt-4 font-medium max-w-md mx-auto">Check-in realizado com sucesso. O seu código de segurança é:</p>

                                <div className="mt-10 p-10 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border-4 border-emerald-100 dark:border-emerald-900/50">
                                    <span className="text-8xl font-black text-emerald-600 tracking-tighter">{securityCode}</span>
                                </div>

                                <div className="mt-12 flex gap-4">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-20 px-10 rounded-[28px] text-xl font-bold"
                                        onClick={resetAll}
                                    >
                                        REALIZAR OUTRO CHECK-IN
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="h-20 px-10 rounded-[28px] text-xl font-bold"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="mr-3 h-6 w-6" /> IMPRIMIR ETIQUETA
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={obsDialogOpen} onOpenChange={setObsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[40px] border-4 p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border-primary/20 shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="bg-white dark:bg-slate-800 p-8 border-b-2 border-slate-100 dark:border-slate-700 shrink-0">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2 text-primary">
                                <MessageSquare className="h-8 w-8 stroke-[3px]" />
                                <DialogTitle className="text-3xl font-black tracking-tight uppercase">Observações</DialogTitle>
                            </div>
                            <DialogDescription className="text-xl font-medium text-slate-500 dark:text-slate-400">
                                Para: <span className="text-slate-900 dark:text-slate-100 font-black underline decoration-primary/30 decoration-4 underline-offset-4">{editingChild?.full_name}</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Sinalizar Atenção para:</label>
                            <div className="flex flex-wrap gap-3">
                                {categories.map(cat => (
                                    <Button
                                        key={cat.id}
                                        type="button"
                                        variant={tempCategories.includes(cat.label) ? "default" : "outline"}
                                        className={`h-14 px-6 rounded-2xl font-black text-sm uppercase flex items-center gap-3 transition-all ${tempCategories.includes(cat.label)
                                            ? "bg-primary border-primary shadow-xl shadow-primary/30 scale-105 hover:scale-105"
                                            : "bg-white dark:bg-slate-800 hover:bg-primary/5 hover:border-primary/40 border-2 border-slate-100 dark:border-slate-700"
                                            }`}
                                        onClick={() => {
                                            setTempCategories(prev =>
                                                prev.includes(cat.label)
                                                    ? prev.filter(c => c !== cat.label)
                                                    : [...prev, cat.label]
                                            );
                                        }}
                                    >
                                        <div className={tempCategories.includes(cat.label) ? "scale-110" : "opacity-70"}>
                                            {cat.icon}
                                        </div>
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Instruções Adicionais:</label>
                            <Textarea
                                placeholder="Descreva aqui detalhes sobre medicação, tipos de alergia ou qualquer cuidado específico que nossa equipe deve ter hoje."
                                className="h-40 rounded-[32px] text-xl font-medium p-8 border-2 border-slate-100 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white dark:bg-slate-800 shadow-inner resize-none dark:text-slate-200"
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
                                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors ml-1"
                            >
                                Limpar Tudo
                            </button>
                        )}
                    </div>

                    <div className="p-8 bg-white dark:bg-slate-800 border-t-2 border-slate-100 dark:border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0">
                        <DialogFooter>
                            <Button
                                className="w-full h-20 text-2xl font-black rounded-[28px] shadow-2xl shadow-primary/40 active:scale-95 transition-all group overflow-hidden relative"
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
                                            description: `As instruções para ${editingChild.full_name} foram salvas para este check-in.`,
                                        });
                                    }
                                }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-tight">
                                    Salvar Informações <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                </span>
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
