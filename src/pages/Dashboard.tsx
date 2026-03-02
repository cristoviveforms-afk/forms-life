import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Users, UserPlus, Heart, ClipboardList, Building2, HandHeart, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
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
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({
    membros: 0,
    visitantes: 0,
    convertidos: 0,
    acompanhamento: 0,
    ministerios: 10,
    servindo: 0,
  });

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end });
    fetchStats(start, end);
  };

  const fetchStats = async (start: string, end: string) => {
    setLoading(true);
    try {
      // Fetch counts in parallel with date filtering
      const [
        { count: membrosCount },
        { count: visitantesCount },
        { count: convertidosCount },
        { count: servindoCount },
        { count: acompanhamentoCount },
      ] = await Promise.all([
        supabase
          .from('people' as any)
          .select('*', { count: 'exact', head: true })
          .eq('type', 'membro')
          .gte('integration_date', start)
          .lte('integration_date', end),
        supabase
          .from('people' as any)
          .select('*', { count: 'exact', head: true })
          .eq('type', 'visitante')
          .gte('created_at', formatStartOfDay(start))
          .lte('created_at', formatEndOfDay(end)),
        supabase
          .from('people' as any)
          .select('*', { count: 'exact', head: true })
          .not('conversion_date', 'is', null)
          .gte('conversion_date', start)
          .lte('conversion_date', end),
        // For served/accompaniment, usually we want current status. 
        // If we want "Started serving this month", we need a date field we don't effectively have for service start.
        // Let's keep these as TOTALS for now or apply same filters if possible?
        // Let's keep them as "Snapshot" of active, filtering by the people who MATCH the date criteria?
        // Actually, if I filter "Membros" by Jan, and "Servindo" is just a boolean, 
        // asking "How many members integrated in Jan are serving?" is a valid metric, but distinct from "Total Serving".
        // Use user intent: "Control of the month".
        // Let's keep "Servindo" and "Acompanhamento" as TOTALS (no date filter) for context, 
        // OR filter people by the date query. 
        // Let's stick to filtering the 3 Main Categories strictly as requested.
        supabase.from('people' as any).select('*', { count: 'exact', head: true }).eq('member_has_served', true),
        supabase.from('people' as any).select('*', { count: 'exact', head: true }).or('convert_wants_accompaniment.eq.true,visitor_wants_contact.eq.true'),
      ]);

      setStats({
        membros: membrosCount || 0,
        visitantes: visitantesCount || 0,
        convertidos: convertidosCount || 0,
        acompanhamento: acompanhamentoCount || 0,
        ministerios: 10,
        servindo: servindoCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper for timestamp comparison (created_at is timestamptz)
  const formatStartOfDay = (date: string) => `${date}T00:00:00`;
  const formatEndOfDay = (date: string) => `${date}T23:59:59`;

  // Load current month's data on mount
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const firstDay = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const lastDayFormatted = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    setDateRange({ start: firstDay, end: lastDayFormatted });
    fetchStats(firstDay, lastDayFormatted);
  }, []);

  const statsCards = [
    { title: 'Total de Membros', value: stats.membros, icon: Users, description: 'Novos este mês', color: 'text-blue-500' },
    { title: 'Visitantes', value: stats.visitantes, icon: UserPlus, description: 'Novos este mês', color: 'text-green-500' },
    { title: 'Novos Convertidos', value: stats.convertidos, icon: Heart, description: 'Decisões este mês', color: 'text-rose-500' },
    // Removed specific counts for served/accompaniment to focus on the requested "Monthly Control"
  ];

  const categoryData = [
    { name: 'Membros', value: stats.membros },
    { name: 'Visitantes', value: stats.visitantes },
    { name: 'Convertidos', value: stats.convertidos },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#22c55e', '#f43f5e'];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8 p-1">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-light tracking-tight text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Acompanhe o crescimento e as estatísticas do ministério.</p>
          </div>
        </div>

        <div className="w-full">
          <MonthYearPicker onDateChange={handleDateChange} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {statsCards.map((stat, i) => (
            <div key={i} className="p-6 rounded-sm border border-border/40 bg-card/30 hover:bg-card/60 transition-colors flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.title}
                </span>
                <stat.icon className={`h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity ${stat.color}`} />
              </div>

              {loading ? (
                <div className="space-y-2 mt-4">
                  <div className="h-10 w-16 bg-muted/50 animate-pulse rounded-sm" />
                  <div className="h-3 w-24 bg-muted/50 animate-pulse rounded-sm" />
                </div>
              ) : (
                <div className="mt-2">
                  <div className="text-4xl font-light tracking-tighter text-foreground">{stat.value}</div>
                  <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold opacity-70">{stat.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action & Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="h-full p-6 space-y-5 rounded-sm border border-border/60 bg-muted/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ações Rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <Button onClick={() => navigate('/cadastro')} className="w-full justify-start text-left rounded-sm h-11" variant="default">
                  <UserPlus className="h-4 w-4 mr-3 opacity-70" />
                  Novo Cadastro
                </Button>
                <Button variant="outline" onClick={() => navigate('/acompanhamento')} className="w-full justify-start text-left rounded-sm h-11 border-border/50 bg-background/50 hover:bg-background">
                  <ClipboardList className="h-4 w-4 mr-3 opacity-70" />
                  Novo Acompanhamento
                </Button>
                <Button variant="outline" onClick={() => navigate('/ministerios')} className="w-full justify-start text-left sm:col-span-2 lg:col-span-1 rounded-sm h-11 border-border/50 bg-background/50 hover:bg-background">
                  <Building2 className="h-4 w-4 mr-3 opacity-70" />
                  Gerenciar Ministérios
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/auto-cadastro`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Link de auto-cadastro copiado!",
                      description: "O link foi copiado para a sua área de transferência.",
                    });
                  }}
                  className="w-full justify-start text-left sm:col-span-2 lg:col-span-1 rounded-sm h-11 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
                >
                  <UserPlus className="h-4 w-4 mr-3" />
                  Link de Cadastro
                </Button>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="lg:col-span-2">
            <div className="h-full p-6 space-y-4 rounded-sm border border-border/40 bg-card/30">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Distribuição no Período</h3>
              <div className="pt-2">
                {loading ? (
                  <div className="h-[250px] md:h-[300px] w-full bg-muted/20 animate-pulse rounded-sm flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">
                    Carregando dados...
                  </div>
                ) : categoryData.length > 0 ? (
                  <div className="h-[250px] md:h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/50" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '4px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '12px'
                          }}
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        />
                        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={24}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="opacity-80 hover:opacity-100 transition-opacity" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] md:h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-border/40 rounded-sm text-xs uppercase tracking-widest">
                    Nenhum dado neste período
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
