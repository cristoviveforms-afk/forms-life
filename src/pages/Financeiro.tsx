import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Plus,
    Filter,
    Download,
    Search,
    ArrowUpCircle,
    ArrowDownCircle,
    DollarSign,
    Calendar as CalendarIcon,
    Tag,
    FileText
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
    id: string;
    date: string;
    type: 'entrada' | 'saida';
    category: string;
    description: string;
    amount: number;
    payment_method: string;
    created_at: string;
}

const CATEGORIES = {
    entrada: ['Oferta', 'Dízimo', 'Doação', 'Campanha', 'Rifa', 'Outros'],
    saida: ['Material', 'Equipamento', 'Infraestrutura', 'Comunicação', 'Fardamento', 'Evento', 'Manutenção', 'Outros']
};

export default function Financeiro() {
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
    const [stats, setStats] = useState({
        totalIn: 0,
        totalOut: 0,
        balance: 0
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        type: 'entrada',
        category: '',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'Pix'
    });
    const { toast } = useToast();

    const handleDateChange = (start: string, end: string) => {
        setDateRange({ start, end });
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financial_transactions' as any)
                .select('*')
                .gte('date', dateRange.start)
                .lte('date', dateRange.end)
                .order('date', { ascending: false });

            if (error) throw error;

            const txs = data as Transaction[];
            setTransactions(txs);

            const totalIn = txs
                .filter(t => t.type === 'entrada')
                .reduce((acc, t) => acc + Number(t.amount), 0);

            const totalOut = txs
                .filter(t => t.type === 'saida')
                .reduce((acc, t) => acc + Number(t.amount), 0);

            setStats({
                totalIn,
                totalOut,
                balance: totalIn - totalOut
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar as transações do período.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [dateRange]);

    const handleAddTransaction = async () => {
        if (!newTransaction.amount || !newTransaction.category) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha o valor e a categoria.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('financial_transactions' as any)
                .insert([{
                    ...newTransaction,
                    amount: parseFloat(newTransaction.amount.replace(',', '.'))
                }]);

            if (error) throw error;

            toast({
                title: "Transação adicionada",
                description: "A transação foi registrada com sucesso."
            });

            setIsDialogOpen(false);
            setNewTransaction({
                type: 'entrada',
                category: '',
                amount: '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                payment_method: 'Pix'
            });
            fetchTransactions();
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast({
                title: "Erro ao adicionar",
                description: "Não foi possível registrar a transação.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const chartData = transactions.reduce((acc: any[], t) => {
        const month = format(new Date(t.date), 'MMM', { locale: ptBR });
        const existing = acc.find(item => item.name === month);
        if (existing) {
            if (t.type === 'entrada') existing.entrada += Number(t.amount);
            else existing.saida += Number(t.amount);
        } else {
            acc.push({
                name: month,
                entrada: t.type === 'entrada' ? Number(t.amount) : 0,
                saida: t.type === 'saida' ? Number(t.amount) : 0
            });
        }
        return acc;
    }, []);

    const categoryData = transactions
        .filter(t => t.type === (stats.totalIn > stats.totalOut ? 'entrada' : 'saida'))
        .reduce((acc: any[], t) => {
            const existing = acc.find(item => item.name === t.category);
            if (existing) existing.value += Number(t.amount);
            else acc.push({ name: t.category, value: Number(t.amount) });
            return acc;
        }, []);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <DashboardLayout title="Financeiro">
            <div className="space-y-6 p-1 animate-fade-in">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Gestão Financeira</h2>
                        <p className="text-muted-foreground">Controle de entradas, saídas e fluxo de caixa do grupo.</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" /> Exportar
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-primary">
                                    <Plus className="h-4 w-4" /> Nova Transação
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Transação</DialogTitle>
                                    <DialogDescription>
                                        Registre uma nova entrada ou saída de recursos.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={newTransaction.type === 'entrada' ? 'default' : 'outline'}
                                            className={newTransaction.type === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                            onClick={() => setNewTransaction({ ...newTransaction, type: 'entrada', category: '' })}
                                        >
                                            <ArrowUpCircle className="mr-2 h-4 w-4" /> Entrada
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={newTransaction.type === 'saida' ? 'default' : 'outline'}
                                            className={newTransaction.type === 'saida' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                                            onClick={() => setNewTransaction({ ...newTransaction, type: 'saida', category: '' })}
                                        >
                                            <ArrowDownCircle className="mr-2 h-4 w-4" /> Saída
                                        </Button>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Categoria</label>
                                        <Select
                                            value={newTransaction.category}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, category: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES[newTransaction.type as keyof typeof CATEGORIES].map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Valor (R$)</label>
                                        <Input
                                            placeholder="0,00"
                                            type="text"
                                            value={newTransaction.amount}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Data</label>
                                        <Input
                                            type="date"
                                            value={newTransaction.date}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Descrição</label>
                                        <Input
                                            placeholder="Ex: Oferta culto domingo"
                                            value={newTransaction.description}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Forma de Pagamento</label>
                                        <Select
                                            value={newTransaction.payment_method}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, payment_method: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pix">Pix</SelectItem>
                                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                                <SelectItem value="Cartão">Cartão</SelectItem>
                                                <SelectItem value="Transferência">Transferência</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleAddTransaction} disabled={loading}>
                                        {loading ? "Salvando..." : "Salvar Transação"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Global Period Filter */}
                <div className="w-full">
                    <MonthYearPicker onDateChange={handleDateChange} />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-emerald-500 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <ArrowUpCircle size={64} className="text-emerald-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Entradas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                R$ {stats.totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <TrendingUp size={12} className="text-emerald-500" /> +12% em relação ao mês anterior
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-rose-500 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <ArrowDownCircle size={64} className="text-rose-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Saídas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600">
                                R$ {stats.totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <TrendingDown size={12} className="text-rose-500" /> +5% em relação ao mês anterior
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={`border-l-4 ${stats.balance >= 0 ? 'border-l-blue-500' : 'border-l-amber-500'} shadow-sm overflow-hidden relative`}>
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Wallet size={64} className="text-blue-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Saldo Disponível</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                                R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Recursos totais em caixa
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts & Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" /> Fluxo de Caixa do Período
                            </CardTitle>
                            <CardDescription>Comparativo de entradas e saídas</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(v) => `R$${v}`} />
                                    <Tooltip
                                        formatter={(v: any) => [`R$ ${v.toLocaleString('pt-BR')}`, '']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="entrada" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="saida" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Category Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Tag className="h-5 w-5 text-primary" /> Distribuição por Categoria
                            </CardTitle>
                            <CardDescription>Onde os recursos estão sendo aplicados</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex flex-col justify-center">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => `R$ ${v.toLocaleString('pt-BR')}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <FileText className="h-12 w-12 opacity-20 mb-2" />
                                    <p>Sem dados para exibir</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions Table */}
                    <Card className="lg:col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Transações no Período</CardTitle>
                                <CardDescription>Lista detalhada das movimentações filtradas</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar..."
                                        className="pl-8 w-[200px] lg:w-[300px]"
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead className="hidden md:table-cell">Descrição</TableHead>
                                            <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length > 0 ? (
                                            transactions.map((t) => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="font-medium">
                                                        {format(new Date(t.date), 'dd/MM/yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={t.type === 'entrada' ? 'default' : 'destructive'} className={t.type === 'entrada' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' : 'bg-rose-100 text-rose-700 hover:bg-rose-100 border-none'}>
                                                            {t.type === 'entrada' ? 'Entrada' : 'Saída'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{t.category}</TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                                                        {t.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">{t.payment_method}</TableCell>
                                                    <TableCell className={`text-right font-bold ${t.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    {loading ? "Carregando..." : "Nenhuma transação encontrada no período."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
