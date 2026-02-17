import { useState, useEffect } from 'react';
import {
    Users,
    Baby,
    AlertCircle,
    Search,
    MoreHorizontal,
    LogOut,
    Bell,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Zap,
    Star,
    UserPlus,
    Printer,
    ClipboardList
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CheckinRecord {
    id: string;
    checkin_time: string;
    security_code: string;
    status: string;
    observations: string;
    child_id: string;
    responsible_id: string;
    children: {
        full_name: string;
        birth_date: string;
        observations: string;
    };
    people: {
        full_name: string;
        phone: string;
        type: string;
    };
}

export default function KidsDashboard() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<CheckinRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<CheckinRecord | null>(null);
    const [confirmCode, setConfirmCode] = useState('');
    const { toast } = useToast();

    const fetchActiveCheckins = async () => {
        setLoading(true);
        try {
            // Fetching checkins where child_id now points to people table (unified schema)
            const { data, error } = await supabase
                .from('kids_checkins' as any)
                .select(`
          *,
          children:child_id(full_name, birth_date, observations),
          people:responsible_id(full_name, phone, type)
        `)
                .neq('status', 'completed')
                .order('checkin_time', { ascending: false });

            if (error) throw error;
            setRecords(data as any[] || []);
        } catch (error) {
            console.error('Error fetching checkins:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveCheckins();

        const channel = supabase
            .channel('kids-checkins-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kids_checkins' }, () => {
                fetchActiveCheckins();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleCheckout = async () => {
        if (!selectedRecord) return;

        if (confirmCode.toUpperCase() !== selectedRecord.security_code.toUpperCase()) {
            toast({
                title: "Código Incorreto",
                description: "O código de segurança não confere com o da etiqueta.",
                variant: "destructive"
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('kids_checkins' as any)
                .update({
                    status: 'completed',
                    checkout_time: new Date().toISOString()
                })
                .eq('id', selectedRecord.id);

            if (error) throw error;

            toast({
                title: "Check-out realizado",
                description: "A criança foi entregue com sucesso."
            });
            setCheckoutDialogOpen(false);
            setConfirmCode('');
            fetchActiveCheckins();
        } catch (error) {
            console.error('Checkout error:', error);
            toast({
                title: "Erro no Check-out",
                description: "Não foi possível processar a saída.",
                variant: "destructive"
            });
        }
    };

    const handleAlertParent = async (record: CheckinRecord) => {
        try {
            const { error } = await supabase
                .from('kids_checkins' as any)
                .update({ status: 'alert' })
                .eq('id', record.id);

            if (error) throw error;

            toast({
                title: "Chamando Responsável",
                description: `O painel do santuário foi alertado para ${record.people.full_name}.`,
            });
            fetchActiveCheckins();
        } catch (error) {
            console.error('Alert error:', error);
            toast({
                title: "Erro ao alertar",
                description: "Não foi possível enviar o alerta.",
                variant: "destructive"
            });
        }
    };

    const handlePrintLabel = (record: CheckinRecord) => {
        toast({
            title: "Reimprimindo Etiqueta",
            description: `Enviando comando de impressão para ${record.children.full_name}...`,
        });
        // In a real scenario, this would trigger the Thermal Printer SDK/API
    };

    const filteredRecords = records.filter(r => {
        const cleanQuery = searchQuery.replace(/\D/g, '');
        const nameMatch = r.children.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        const codeMatch = cleanQuery.length >= 2 && r.security_code.toUpperCase().includes(searchQuery.toUpperCase());
        const phoneMatch = cleanQuery.length >= 4 && r.people.phone.replace(/\D/g, '').includes(cleanQuery);

        return nameMatch || codeMatch || phoneMatch;
    });

    const stats = {
        total: records.length,
        visitantes: records.filter(r => r.people.type === 'visitante').length,
        alertas: records.filter(r => r.children.observations || r.status === 'alert').length
    };

    const capacityLimit = 40; // Exemplo de limite
    const capacityPercent = Math.min(100, Math.round((stats.total / capacityLimit) * 100));

    return (
        <DashboardLayout title="Kids - Painel do Líder">
            <div className="space-y-8 p-1 animate-fade-in">

                {/* Header Summary with Premium Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-500/20">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Presentes Agora</p>
                                    <p className="text-4xl font-black">{stats.total}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <Baby className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-indigo-100/80">
                                <Zap className="h-3 w-3 fill-current" />
                                <span>Capacidade de {capacityLimit} crianças</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-1">Visitantes hoje</p>
                                    <p className="text-4xl font-black">{stats.visitantes}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-100/80">
                                <Star className="h-3 w-3 fill-current" />
                                <span>Novas conexões hoje</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Capacidade</p>
                                    <p className="text-4xl font-black text-slate-800 dark:text-white">{capacityPercent}%</p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
                                    <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                </div>
                            </div>
                            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${capacityPercent > 90 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'}`}
                                    style={{ width: `${capacityPercent}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`relative overflow-hidden border-none shadow-xl ${stats.alertas > 0 ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20' : 'bg-slate-50 text-slate-400'}`}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`${stats.alertas > 0 ? 'text-rose-100' : 'text-slate-500'} text-xs font-black uppercase tracking-widest mb-1`}>Restrições e Alergias</p>
                                    <p className="text-4xl font-black">{stats.alertas}</p>
                                </div>
                                <div className={`${stats.alertas > 0 ? 'bg-white/20' : 'bg-slate-200'} p-3 rounded-2xl backdrop-blur-sm`}>
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs">
                                {stats.alertas > 0 ? '⚠️ Atenção necessária' : 'Nenhuma restrição registrada'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Attendance List */}
                <Card className="border-none shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-10 pt-8 px-8">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight">Lista de Presença Digital</CardTitle>
                            <CardDescription className="text-base">Monitoramento contínuo do fluxo de entrada e saída</CardDescription>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Pesquisar..."
                                    className="pl-11 w-[300px] h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm focus:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl" onClick={fetchActiveCheckins}>
                                <Clock className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                                    <TableRow className="border-b border-slate-100 dark:border-slate-800">
                                        <TableHead className="w-[100px] font-black uppercase text-[10px] tracking-widest text-slate-500 pl-8">Código</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Criança / Turma</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Responsável</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Horário</TableHead>
                                        <TableHead className="hidden md:table-cell font-black uppercase text-[10px] tracking-widest text-slate-500">Status Médico</TableHead>
                                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-500 pr-8">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                                    <span className="font-medium">Sincronizando dados...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRecords.length > 0 ? (
                                        filteredRecords.map((record) => (
                                            <TableRow key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                                                <TableCell className="pl-8">
                                                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-center border border-slate-200 dark:border-slate-700">
                                                        {record.security_code}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 dark:text-slate-100">{record.children.full_name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-black bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-none">
                                                                {record.children.birth_date ? `${new Date().getFullYear() - new Date(record.children.birth_date).getFullYear()} ANOS` : 'N/I'}
                                                            </Badge>
                                                            {record.people.type === 'visitante' && (
                                                                <Badge className="text-[10px] py-0 px-1.5 h-4 font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-none">
                                                                    VISITANTE
                                                                </Badge>
                                                            )}
                                                            {record.status === 'alert' && (
                                                                <Badge className="text-[10px] py-0 px-1.5 h-4 font-black bg-rose-600 text-white border-none animate-pulse">
                                                                    CHAMANDO PAIS
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{record.people.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{record.people.phone}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(record.checkin_time), 'HH:mm')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {record.children.observations ? (
                                                        <div className="flex items-center gap-2 text-rose-500 font-bold text-xs bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-100 dark:border-rose-900/50">
                                                            <AlertCircle size={14} />
                                                            {record.children.observations}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Nenhuma observação</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-primary hover:text-primary hover:bg-primary/10 font-bold rounded-xl"
                                                            onClick={() => handleAlertParent(record)}
                                                        >
                                                            <Bell className="h-4 w-4 mr-2" /> Chamar
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl">
                                                                    <MoreHorizontal className="h-5 w-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-[200px] rounded-2xl p-2 shadow-2xl">
                                                                <DropdownMenuLabel className="mb-1 text-xs uppercase tracking-widest opacity-50">Gestão Kids</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    className="rounded-xl text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-900/20 py-2.5 font-bold"
                                                                    onClick={() => {
                                                                        setSelectedRecord(record);
                                                                        setCheckoutDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Validar Check-out
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="rounded-xl py-2.5 font-medium"
                                                                    onClick={() => handlePrintLabel(record)}
                                                                >
                                                                    <Printer className="mr-2 h-4 w-4" /> Reimprimir Etiqueta
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="rounded-xl py-2.5 font-medium">
                                                                    <ClipboardList className="mr-2 h-4 w-4" /> Ver Ficha Médica
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full">
                                                        <Baby className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-800 dark:text-slate-200 font-black text-xl">
                                                            {searchQuery ? "Nenhum resultado" : "Nenhuma criança agora"}
                                                        </p>
                                                        <p className="text-slate-500 text-sm mt-1">
                                                            {searchQuery
                                                                ? "Tente buscar por outro nome, código ou parte do telefone."
                                                                : "Aguardando o primeiro check-in de hoje aparecer por aqui."}
                                                        </p>
                                                    </div>
                                                    {!searchQuery && (
                                                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-3 text-left">
                                                            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                                                            <p className="text-xs text-primary/80 leading-relaxed font-medium">
                                                                <strong>Dica do Líder:</strong> Use o botão "Chamar" para alertar os pais no telão do santuário silenciosamente.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Checkout Verification Dialog */}
                <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                    <DialogContent className="max-w-md rounded-3xl p-8 border-none outline-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Validar Saída</DialogTitle>
                            <DialogDescription className="text-base pt-2">
                                Confirme o código da etiqueta do responsável para liberar a criança.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedRecord && (
                            <div className="space-y-6 pt-4">
                                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-2xl">
                                            <Baby className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Criança</p>
                                            <p className="text-xl font-bold">{selectedRecord.children.full_name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold ml-1">Digite o Código de Segurança</label>
                                    <Input
                                        placeholder="Ex: A1B2"
                                        className="h-16 text-center text-3xl font-black uppercase tracking-[0.5em] rounded-2xl border-2 focus:border-primary shadow-inner"
                                        maxLength={4}
                                        value={confirmCode}
                                        onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-6 gap-3">
                            <Button variant="outline" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setCheckoutDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button className="h-14 flex-1 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20" onClick={handleCheckout}>
                                Confirmar Saída
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
