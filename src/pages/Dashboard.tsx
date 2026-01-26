import { useState, useEffect } from 'react';
import { Users, UserPlus, Heart, ClipboardList, Building2, HandHeart, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
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
      <div className="space-y-8 animate-fade-in p-1">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
            <p className="text-muted-foreground">Acompanhe o crescimento e as estatísticas do ministério.</p>
          </div>
          <div className="flex items-center bg-background rounded-lg border p-1">
            <MonthYearPicker onDateChange={handleDateChange} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat, i) => (
            <Card key={i} className="hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: stat.color ? `var(--${stat.color.split('-')[1]})` : '' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full bg-secondary/50 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
                    <div className="h-4 w-24 bg-secondary animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action & Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="h-full border-none shadow-md bg-gradient-to-br from-card to-secondary/10">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button onClick={() => navigate('/cadastro')} className="w-full justify-start text-left" size="lg">
                  <UserPlus className="h-5 w-5 mr-3 text-primary-foreground/80" />
                  Novo Cadastro
                </Button>
                <Button variant="secondary" onClick={() => navigate('/acompanhamento')} className="w-full justify-start text-left" size="lg">
                  <ClipboardList className="h-5 w-5 mr-3" />
                  Novo Acompanhamento
                </Button>
                <Button variant="outline" onClick={() => navigate('/ministerios')} className="w-full justify-start text-left" size="lg">
                  <Building2 className="h-5 w-5 mr-3" />
                  Gerenciar Ministérios
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Charts Area */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Distribuição no Período</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] w-full bg-secondary/30 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">
                    Carregando dados...
                  </div>
                ) : categoryData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    Nenhum dado neste período
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
