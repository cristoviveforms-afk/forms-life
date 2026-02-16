import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cake, MessageCircle, Loader2, Phone, Calendar, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types/database';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';

export default function Aniversariantes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const handleDateChange = (start: string, end: string) => {
        const month = parseInt(start.split('-')[1], 10);
        const day = start === end ? parseInt(start.split('-')[2], 10) : null;
        setSelectedMonth(month);
        setSelectedDay(day);
        fetchBirthdays(month, day);
    };

    useEffect(() => {
        fetchBirthdays(selectedMonth, selectedDay);
    }, []);

    const fetchBirthdays = async (monthToFetch: number, dayToFetch: number | null) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('people' as any)
                .select('*')
                .not('birth_date', 'is', null);

            if (error) throw error;

            // Filter in memory for birthdays in selected month (and day if provided)
            const filtered = (data as Person[]).filter((person) => {
                if (!person.birth_date) return false;
                const m = parseInt(person.birth_date.split('-')[1], 10);
                const d = parseInt(person.birth_date.split('-')[2], 10);

                const matchesMonth = m === monthToFetch;
                const matchesDay = dayToFetch === null || d === dayToFetch;

                return matchesMonth && matchesDay;
            });

            // Sort by day
            filtered.sort((a, b) => {
                const dayA = parseInt(a.birth_date!.split('-')[2], 10);
                const dayB = parseInt(b.birth_date!.split('-')[2], 10);
                return dayA - dayB;
            });

            setPeople(filtered);
        } catch (error) {
            console.error('Erro ao buscar aniversariantes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredParticipants = people.filter((p) =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMonthName = (month: number) => {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return months[month - 1];
    };

    const getDay = (dateStr: string) => {
        return parseInt(dateStr.split('-')[2], 10);
    };

    const handleWhatsApp = (phone?: string) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
    };

    return (
        <DashboardLayout title="Aniversariantes do Mês">
            <div className="space-y-6 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Cake className="h-6 w-6 text-primary" />
                            {getMonthName(selectedMonth)}
                        </h2>
                        <p className="text-muted-foreground">
                            Comemorando a vida de nossos membros e visitantes.
                        </p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar aniversariante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-11 rounded-xl bg-background/50 border-border/40"
                        />
                    </div>
                </div>

                <div className="w-full">
                    <MonthYearPicker onDateChange={handleDateChange} />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground animate-pulse">Carregando aniversariantes...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredParticipants.length === 0 ? (
                            <div className="col-span-full bg-muted/30 border-2 border-dashed rounded-3xl p-12 text-center">
                                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold">Nenhum aniversariante</h3>
                                <p className="text-muted-foreground">Não encontramos aniversariantes para este mês ou com este nome.</p>
                            </div>
                        ) : (
                            filteredParticipants.map((person) => (
                                <Card key={person.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/10">
                                    <CardHeader className="p-0">
                                        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent flex items-center px-6 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                                                <Cake className="h-20 w-20" />
                                            </div>
                                            <div className="flex items-center gap-4 z-10">
                                                <div className="h-16 w-16 rounded-2xl bg-primary flex flex-col items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <span className="text-xs font-bold uppercase tracking-widest leading-none mb-1">Dia</span>
                                                    <span className="text-2xl font-black leading-none">{getDay(person.birth_date!)}</span>
                                                </div>
                                                <div>
                                                    <Badge variant="secondary" className="mb-1 uppercase text-[10px] font-bold tracking-wider">
                                                        {person.type === 'membro' ? 'Membro' : 'Visitante'}
                                                    </Badge>
                                                    <CardTitle className="text-lg leading-tight line-clamp-1">{person.full_name}</CardTitle>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium">{person.phone || 'Sem telefone'}</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1 rounded-xl h-11 font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 group/btn"
                                                    onClick={() => handleWhatsApp(person.phone)}
                                                >
                                                    <MessageCircle className="mr-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                                                    Parabenizar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-11 w-11 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors"
                                                    onClick={() => window.location.href = `/acompanhamento?personId=${person.id}`}
                                                >
                                                    <User className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
