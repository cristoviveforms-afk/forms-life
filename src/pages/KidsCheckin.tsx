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
    Users
} from 'lucide-react';
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
}

interface Child {
    id: string;
    full_name: string;
    birth_date: string;
    parent_id: string;
    medical_observations?: string;
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
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const cleanSearch = searchQuery.replace(/\D/g, '');

            // Re-fetch with a more flexible query to handle existing formatted data or name search
            const { data: people, error: fetchError } = await supabase
                .from('people')
                .select('id, full_name, cpf, phone, type, family_id');

            if (fetchError) throw fetchError;

            // Simple client-side search for hybrid flexibility
            const filtered = (people || []).filter(p => {
                const dbCpf = p.cpf?.replace(/\D/g, '');
                const dbPhone = p.phone?.replace(/\D/g, '');
                const nameMatch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
                const cpfMatch = cleanSearch.length >= 8 && dbCpf?.includes(cleanSearch);
                const phoneMatch = cleanSearch.length >= 4 && dbPhone?.includes(cleanSearch);

                return nameMatch || cpfMatch || phoneMatch;
            }).slice(0, 5);

            setParents(filtered);

            if (filtered.length === 0) {
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
        setLoading(true);
        try {
            // Search for children in the people table unified schema
            // Children have the same family_id but are NOT the parent themselves
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('family_id', parent.family_id)
                .neq('id', parent.id)
                .contains('ministries', ['Ministério Infantil (Kids)']);

            if (error) throw error;

            // Map to Child interface
            const mappedChildren: Child[] = (data || []).map(p => ({
                id: p.id,
                full_name: p.full_name,
                birth_date: p.birth_date,
                parent_id: parent.id,
                medical_observations: p.observations || '' // Using spiritual_gifts or a dedicated column if available
            }));

            setChildren(mappedChildren);
            setStep(2);

            if (parent.type === 'visitante') {
                toast({
                    title: "Visitante Especial!",
                    description: "Ficamos felizes com sua presença. Bem-vindos ao Kids!",
                });
            }
        } catch (error) {
            console.error('Fetch children error:', error);
        } finally {
            setLoading(false);
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
            const checkins = selectedChildren.map(childId => ({
                child_id: childId,
                responsible_id: selectedParent?.id,
                security_code: code,
                status: 'active'
            }));

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
                                <p className="text-slate-500 text-lg">Insira seu CPF ou Nome Completo</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Ex: 000.000.000-00 ou Nome"
                                        className="h-20 pl-16 text-2xl font-bold rounded-3xl border-2 focus:border-primary shadow-sm bg-slate-50/50 dark:bg-slate-900/50"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const digits = val.replace(/\D/g, '');
                                            if (digits.length === 11 && !val.includes(' ')) {
                                                // Probable CPF masking
                                                setSearchQuery(digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
                                            } else {
                                                setSearchQuery(val);
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
                                    <div className="grid gap-3">
                                        {parents.map(p => (
                                            <Button
                                                key={p.id}
                                                variant="outline"
                                                className="w-full h-20 justify-between px-8 rounded-3xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                                                onClick={() => handleSelectParent(p)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                        <User className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xl">{p.full_name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">CPF: {p.cpf || 'Não informado'}</span>
                                                            {p.type === 'visitante' && (
                                                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-none font-black px-1.5 h-4">
                                                                    VISITANTE
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-6 w-6 text-primary scale-0 group-hover:scale-100 transition-transform" />
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
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="font-black text-[10px]">
                                                            {child.birth_date ? `${new Date().getFullYear() - new Date(child.birth_date).getFullYear()} ANOS` : 'N/I'}
                                                        </Badge>
                                                        {child.medical_observations && (
                                                            <Badge variant="destructive" className="font-black text-[10px]">
                                                                ⚠️ {child.medical_observations}
                                                            </Badge>
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
                                <p className="text-slate-500 text-xl mt-4">As etiquetas estão sendo impressas. Desejamos um ótimo culto às crianças!</p>
                            </div>

                            <div className="bg-slate-900 text-white p-12 rounded-[50px] relative shadow-2xl shadow-slate-900/40">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
                                <p className="text-slate-400 uppercase text-sm font-black tracking-[0.3em] mb-3">CÓDIGO DE RETIRADA</p>
                                <p className="text-7xl font-black tracking-[0.4em] select-none">{securityCode}</p>
                                <div className="mt-10 flex items-center justify-center gap-3 text-slate-300">
                                    <Printer className="h-6 w-6 animate-pulse" />
                                    <span className="text-lg font-medium">Imprimindo etiquetas térmicas...</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-8 rounded-[32px] border-2 border-indigo-100 dark:border-indigo-900/50 flex gap-4 text-left items-start">
                                    <AlertCircle size={24} className="text-indigo-600 mt-1 shrink-0" />
                                    <p className="text-indigo-900 dark:text-indigo-200 text-lg leading-tight font-medium">
                                        <strong>Atenção Responsável:</strong> Guarde o código acima. Ele é obrigatório para a retirada da criança no final do culto.
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full h-20 text-2xl font-black rounded-3xl"
                                    onClick={resetAll}
                                >
                                    FINALIZAR
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
