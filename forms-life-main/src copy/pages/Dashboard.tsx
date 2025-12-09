import { Users, UserPlus, Heart, ClipboardList, Building2, HandHeart } from 'lucide-react';
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

const statsCards = [
  { title: 'Total de Membros', value: '248', icon: Users, change: '+12 este mês' },
  { title: 'Visitantes', value: '45', icon: UserPlus, change: '+8 esta semana' },
  { title: 'Novos Convertidos', value: '23', icon: Heart, change: '+5 este mês' },
  { title: 'Em Acompanhamento', value: '18', icon: ClipboardList, change: '3 pendentes' },
  { title: 'Ministérios Ativos', value: '12', icon: Building2, change: '85 pessoas' },
  { title: 'Pessoas Servindo', value: '67', icon: HandHeart, change: '27% dos membros' },
];

const monthlyData = [
  { name: 'Jan', cadastros: 12 },
  { name: 'Fev', cadastros: 19 },
  { name: 'Mar', cadastros: 15 },
  { name: 'Abr', cadastros: 22 },
  { name: 'Mai', cadastros: 18 },
  { name: 'Jun', cadastros: 25 },
];

const categoryData = [
  { name: 'Membros', value: 248 },
  { name: 'Visitantes', value: 45 },
  { name: 'Convertidos', value: 23 },
];

const COLORS = ['hsl(0, 0%, 20%)', 'hsl(0, 0%, 40%)', 'hsl(0, 0%, 60%)'];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/cadastro')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cadastro
            </Button>
            <Button variant="outline" onClick={() => navigate('/acompanhamento')}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Novo Acompanhamento
            </Button>
            <Button variant="outline" onClick={() => navigate('/ministerios')}>
              <Building2 className="h-4 w-4 mr-2" />
              Gerenciar Ministérios
            </Button>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cadastros por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="cadastros" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: 'Maria Silva foi cadastrada como membro', time: 'Há 2 horas' },
                { text: 'João Pedro completou o acompanhamento', time: 'Há 5 horas' },
                { text: 'Ana Costa se converteu', time: 'Há 1 dia' },
                { text: 'Carlos Oliveira visitou pela primeira vez', time: 'Há 2 dias' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{activity.text}</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
