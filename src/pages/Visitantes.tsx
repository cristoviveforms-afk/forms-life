import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types/database';

export default function Visitantes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [visitantes, setVisitantes] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisitantes();
  }, []);

  const fetchVisitantes = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('type', 'visitante');

      if (error) throw error;
      setVisitantes(data as Person[]);
    } catch (error) {
      console.error('Erro ao buscar visitantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitantes = visitantes.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: visitantes.length,
    hoje: visitantes.filter(v => {
      const date = v.created_at ? new Date(v.created_at) : null;
      const today = new Date();
      return date && date.toDateString() === today.toDateString();
    }).length,
    primeiraVez: visitantes.filter(v => v.visitor_first_time).length,
    'aguardando contato': visitantes.filter(v => v.visitor_wants_contact).length,
  };

  return (
    <DashboardLayout title="Visitantes">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar visitantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/cadastro?tipo=visitante')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Visitante
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.total}</div>
              <p className="text-xs text-muted-foreground">Total de Visitantes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.hoje}</div>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.primeiraVez}</div>
              <p className="text-xs text-muted-foreground">Primeira Vez</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats['aguardando contato']}</div>
              <p className="text-xs text-muted-foreground">Querem Contato</p>
            </CardContent>
          </Card>
        </div>

        {/* Visitors List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Visitantes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredVisitantes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum visitante encontrado.</p>
                ) : (
                  filteredVisitantes.map((visitante) => (
                    <div
                      key={visitante.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                          {visitante.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{visitante.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {visitante.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {visitante.visitor_first_time && (
                          <Badge>Primeira Vez</Badge>
                        )}
                        <Badge variant={!visitante.visitor_wants_contact ? 'secondary' : 'outline'}>
                          {visitante.visitor_wants_contact ? 'Quer Contato' : 'Não quer contato'}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Registrar Contato</DropdownMenuItem>
                            <DropdownMenuItem>Converter para Membro</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
