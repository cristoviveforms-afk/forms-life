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
    ClipboardList,
    Camera,
    X,
    Upload,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon
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
    photos?: string[];
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

// Helper Component for parsing and rendering observations with badges
const ObservationBadges = ({ text, type }: { text: string; type: 'session' | 'permanent' }) => {
    if (!text) return null;

    const match = text.match(/^\[(.*?)\] (.*)$/);
    const categories = match ? match[1].split(',').map(s => s.trim()) : [];
    const description = match ? match[2] : text;

    const getBadgeStyle = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('alergia')) return "bg-rose-500 text-white shadow-rose-200";
        if (c.includes('medica')) return "bg-blue-600 text-white shadow-blue-200";
        if (c.includes('alimentar')) return "bg-orange-500 text-white shadow-orange-200";
        if (c.includes('cuidado')) return "bg-purple-600 text-white shadow-purple-200";
        return "bg-slate-500 text-white shadow-slate-200";
    };

    return (
        <div className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 cursor-default group/obs ${type === 'session'
            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 shadow-sm hover:border-rose-300 dark:hover:border-rose-700"
            : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 shadow-sm hover:border-amber-300 dark:hover:border-amber-700"
            }`}>
            <div className="flex items-center gap-2">
                {type === 'session' ? (
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                ) : (
                    <Baby className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-widest ${type === 'session' ? "text-rose-600" : "text-amber-700"
                    }`}>
                    {type === 'session' ? "Cuidado Hoje" : "Permanente"}
                </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-1">
                {categories.map((cat, i) => (
                    <span
                        key={i}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-sm ${getBadgeStyle(cat)}`}
                    >
                        {cat}
                    </span>
                ))}
            </div>

            <p className={`text-sm font-medium leading-tight mt-1 ${type === 'session' ? "text-rose-900 dark:text-rose-100" : "text-amber-900 dark:text-amber-100"
                }`}>
                {description}
            </p>
        </div>
    );
};

export default function KidsDashboard() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<CheckinRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<CheckinRecord | null>(null);
    const [confirmCode, setConfirmCode] = useState('');
    const [photoUploadDialogOpen, setPhotoUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
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

    const handleUploadPhotos = async (files: FileList) => {
        if (!selectedRecord) return;

        const currentPhotos = selectedRecord.photos || [];
        if (currentPhotos.length + files.length > 5) {
            toast({
                title: "Limite de fotos atingido",
                description: "Você pode enviar no máximo 5 fotos por check-in.",
                variant: "destructive"
            });
            return;
        }

        setUploading(true);
        const newPhotoUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${selectedRecord.id}/${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError, data } = await supabase.storage
                    .from('kids-photos')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('kids-photos')
                    .getPublicUrl(filePath);

                newPhotoUrls.push(publicUrl);
            }

            const { error: updateError } = await supabase
                .from('kids_checkins' as any)
                .update({
                    photos: [...currentPhotos, ...newPhotoUrls]
                })
                .eq('id', selectedRecord.id);

            if (updateError) throw updateError;

            toast({
                title: "Fotos enviadas",
                description: `${files.length} foto(s) foram adicionadas ao registro.`,
            });

            fetchActiveCheckins();
            // Update local selected record to reflect changes immediately
            setSelectedRecord(prev => prev ? { ...prev, photos: [...(prev.photos || []), ...newPhotoUrls] } : null);
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Erro no envio",
                description: "Não foi possível carregar as fotos.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoUrl: string) => {
        if (!selectedRecord) return;

        try {
            const updatedPhotos = (selectedRecord.photos || []).filter(p => p !== photoUrl);

            const { error: updateError } = await supabase
                .from('kids_checkins' as any)
                .update({ photos: updatedPhotos })
                .eq('id', selectedRecord.id);

            if (updateError) throw updateError;

            // Optional: Delete from storage as well
            const path = photoUrl.split('kids-photos/')[1];
            if (path) {
                await supabase.storage.from('kids-photos').remove([path]);
            }

            setSelectedRecord(prev => prev ? { ...prev, photos: updatedPhotos } : null);
            fetchActiveCheckins();

            toast({
                title: "Foto removida",
                description: "A foto foi excluída com sucesso.",
            });
        } catch (error) {
            console.error('Delete photo error:', error);
        }
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden border bg-card p-6 rounded-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Presentes Agora</p>
                                <p className="text-4xl font-black">{stats.total}</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-sm">
                                <Baby className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-bold">
                            <Zap className="h-3 w-3" />
                            <span>Capacidade de {capacityLimit} crianças</span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden border bg-card p-6 rounded-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Visitantes hoje</p>
                                <p className="text-4xl font-black">{stats.visitantes}</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-sm">
                                <UserPlus className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-bold">
                            <Star className="h-3 w-3" />
                            <span>Novas conexões hoje</span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden border bg-card p-6 rounded-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Capacidade</p>
                                <p className="text-4xl font-black">{capacityPercent}%</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-sm">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-muted h-1.5 rounded-sm overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${capacityPercent > 90 ? 'bg-destructive' : 'bg-primary'}`}
                                style={{ width: `${capacityPercent}%` }}
                            />
                        </div>
                    </div>

                    <div className="relative overflow-hidden border bg-card p-6 rounded-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Restrições e Alergias</p>
                                <p className="text-4xl font-black">{stats.alertas}</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-sm">
                                <AlertCircle className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-bold">
                            {stats.alertas > 0 ? '⚠️ Atenção necessária' : 'Nenhuma restrição'}
                        </div>
                    </div>
                </div>

                {/* Main Attendance List */}
                <div className="border border-border/50 bg-card rounded-sm mb-6 mt-6">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 border-b border-border/50">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">Lista de Presença Digital</h3>
                            <p className="text-sm text-muted-foreground mt-1">Monitoramento contínuo correndo</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Pesquisar..."
                                    className="pl-11 w-[300px] h-10 rounded-sm bg-background border focus-visible:ring-1 focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-sm" onClick={fetchActiveCheckins}>
                                <Clock className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="p-0">
                        <div className="overflow-hidden">
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
                                                <TableCell className="hidden md:table-cell py-4 min-w-[280px]">
                                                    {(record.observations || record.children.observations) ? (
                                                        <div className="flex flex-col gap-3">
                                                            {record.observations && (
                                                                <ObservationBadges text={record.observations} type="session" />
                                                            )}
                                                            {record.children.observations && (
                                                                <ObservationBadges text={record.children.observations} type="permanent" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700 italic text-xs ml-2">
                                                            <ShieldCheck className="h-3.5 w-3.5 opacity-50" />
                                                            Nenhuma observação
                                                        </div>
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
                                                                    className="rounded-xl py-2.5 font-bold text-primary focus:text-primary focus:bg-primary/5"
                                                                    onClick={() => {
                                                                        setSelectedRecord(record);
                                                                        setPhotoUploadDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Camera className="mr-2 h-4 w-4" /> Anexar Fotos ({(record.photos?.length || 0)}/5)
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="rounded-xl py-2.5 font-medium"
                                                                    onClick={() => handlePrintLabel(record)}
                                                                >
                                                                    <Printer className="mr-2 h-4 w-4" /> Reimprimir Etiqueta
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
                    </div>
                </div>

                {/* Photo Upload Dialog */}
                <Dialog open={photoUploadDialogOpen} onOpenChange={setPhotoUploadDialogOpen}>
                    <DialogContent className="max-w-2xl rounded-sm p-0 overflow-hidden border shadow-lg bg-card flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-muted/30 border-b shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-sm">
                                        <Camera className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold uppercase tracking-widest">Fotos</DialogTitle>
                                        <DialogDescription className="text-xs font-bold uppercase tracking-widest mt-1">
                                            Compartilhe momentos de <span className="text-foreground">{selectedRecord?.children.full_name}</span> com os pais hoje.
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Badge variant="outline" className="h-8 px-4 rounded-sm font-bold text-xs uppercase tracking-widest">
                                    {selectedRecord?.photos?.length || 0} / 5
                                </Badge>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* Upload Area */}
                            {(selectedRecord?.photos?.length || 0) < 5 && (
                                <div className="relative group/upload">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                handleUploadPhotos(e.target.files);
                                            }
                                        }}
                                        disabled={uploading}
                                    />
                                    <div className={`h-40 border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-3 transition-all ${uploading
                                        ? "bg-muted border-border"
                                        : "bg-primary/5 border-primary/20 hover:border-primary hover:bg-primary/10"
                                        }`}>
                                        {uploading ? (
                                            <>
                                                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                                                <p className="text-sm font-bold text-primary uppercase tracking-widest">Enviando fotos...</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="bg-primary/10 p-4 rounded-sm">
                                                    <Upload className="h-8 w-8 text-primary" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold uppercase tracking-tight text-foreground">Clique ou arraste fotos aqui</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">JPG ou PNG (Máx 5MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Gallery Grid */}
                            {selectedRecord?.photos && selectedRecord.photos.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {selectedRecord.photos.map((photo, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-sm overflow-hidden group/photo border bg-muted">
                                            <img
                                                src={photo}
                                                alt={`Momento ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                                            <button
                                                onClick={() => handleDeletePhoto(photo)}
                                                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-destructive text-white rounded-sm backdrop-blur-md flex items-center justify-center transition-colors opacity-0 group-hover/photo:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <div className="absolute bottom-3 left-3 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                                                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Foto {idx + 1}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !uploading && (
                                <div className="text-center py-12 border border-dashed rounded-sm">
                                    <div className="bg-muted h-16 w-16 rounded-sm flex items-center justify-center mx-auto mb-4">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Nenhuma foto enviada ainda.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-muted/30 shrink-0">
                            <Button
                                className="w-full h-12 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors"
                                onClick={() => setPhotoUploadDialogOpen(false)}
                            >
                                Concluído
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Checkout Verification Dialog */}
                <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                    <DialogContent className="max-w-md rounded-sm p-0 overflow-hidden border shadow-lg bg-card">
                        <div className="p-6 border-b bg-muted/30 shrink-0">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold uppercase tracking-widest">Validar Saída</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">
                                    Confirme o código da etiqueta.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {selectedRecord && (
                            <div className="p-6 space-y-6">
                                <div className="bg-muted/30 p-6 rounded-sm border border-dashed flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-sm">
                                        <Baby className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Criança</p>
                                        <p className="text-lg font-bold uppercase tracking-tight">{selectedRecord.children.full_name}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Código de Segurança</label>
                                    <Input
                                        placeholder="Ex: A1B2"
                                        className="h-12 text-center text-xl font-black uppercase tracking-[0.5em] rounded-sm border focus-visible:ring-1 focus-visible:ring-primary/20 bg-background"
                                        maxLength={4}
                                        value={confirmCode}
                                        onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="p-6 border-t bg-muted/30 flex gap-3 shrink-0">
                            <Button variant="outline" className="h-12 flex-1 rounded-sm text-[10px] font-bold uppercase tracking-widest" onClick={() => setCheckoutDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button className="h-12 flex-1 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-none" onClick={handleCheckout}>
                                Confirmar Saída
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
