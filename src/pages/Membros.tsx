import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types/database';

export default function Membros() {
  const [searchTerm, setSearchTerm] = useState('');
  const [membros, setMembros] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembros();
  }, []);

  const fetchMembros = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('type', 'membro');

      if (error) throw error;
      setMembros(data as Person[]);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembros = membros.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: membros.length,
    batizados: membros.filter(m => m.baptized_water).length,
    servindo: membros.filter(m => m.member_has_served).length,
    celulas: membros.filter(m => m.has_cell).length,
  };

  return (
    <DashboardLayout title="Membros">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
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
            <Button onClick={() => navigate('/cadastro?tipo=membro')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Membro
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.total}</div>
              <p className="text-xs text-muted-foreground">Total de Membros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.batizados}</div>
              <p className="text-xs text-muted-foreground">Batizados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.servindo}</div>
              <p className="text-xs text-muted-foreground">Servindo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.celulas}</div>
              <p className="text-xs text-muted-foreground">Em Células</p>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembros.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum membro encontrado.</p>
                ) : (
                  filteredMembros.map((membro) => (
                    <div
                      key={membro.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                          {membro.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{membro.name}</p>
                          <p className="text-sm text-muted-foreground">{membro.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={membro.baptized_water ? 'default' : 'outline'}>
                          {membro.baptized_water ? 'Batizado' : 'Não Batizado'}
                        </Badge>
                        {membro.member_has_served && (
                          <Badge variant="secondary">Servindo</Badge>
                        )}
                        {membro.has_cell && (
                          <Badge variant="outline">{membro.cell_name || 'Célula'}</Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Acompanhamento</DropdownMenuItem>
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
