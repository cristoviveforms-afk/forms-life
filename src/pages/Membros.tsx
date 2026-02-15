import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types/database';

import { MonthYearPicker } from '@/components/ui/MonthYearPicker';

export default function Membros() {
  const [searchTerm, setSearchTerm] = useState('');
  const [membros, setMembros] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // No useEffect initial fetch needed if the picker triggers on mount (it does via its useEffect)
  // or we can keep it empty and let the picker drive.
  // The picker has a useEffect that calls onDateChange on mount? Yes.

  const handleDateChange = (start: string, end: string) => {
    fetchMembros(start, end);
  };

  const fetchMembros = async (start: string, end: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('people' as any)
        .select('*')
        .eq('type', 'membro')
        .gte('integration_date', start)
        .lte('integration_date', end);

      if (error) throw error;
      setMembros(data as unknown as Person[]);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembros = membros.filter((m) =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: membros.length,
    batizados: membros.filter(m => m.baptized_water).length,
    servindo: membros.filter(m => m.member_has_served).length,
    ministerios: membros.filter(m => m.has_ministry).length,
  };

  return (
    <DashboardLayout title="Membros">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <MonthYearPicker onDateChange={handleDateChange} />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/cadastro?tipo=membro')} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">Novo Membro</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="pt-4 p-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.total}</div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 p-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.batizados}</div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Batizados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 p-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.servindo}</div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Servindo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 p-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.ministerios}</div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ministérios</p>
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
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group gap-4"
                      onClick={() => navigate(`/acompanhamento?personId=${membro.id}`)}
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center font-medium group-hover:bg-primary/20 transition-colors">
                          {membro.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium flex items-center gap-2 truncate">
                            {membro.full_name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{membro.phone}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                        {membro.conversion_date && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 border-0 text-white whitespace-nowrap">
                            Novo Convertido
                          </Badge>
                        )}
                        <Badge variant={membro.baptized_water ? 'default' : 'outline'} className="whitespace-nowrap">
                          {membro.baptized_water ? 'Batizado' : 'Não Batizado'}
                        </Badge>
                        {membro.member_has_served && (
                          <Badge variant="secondary" className="whitespace-nowrap">Servindo</Badge>
                        )}
                        {membro.has_ministry && membro.ministries && membro.ministries.length > 0 && (
                          <Badge variant="outline" className="whitespace-nowrap">{membro.ministries.length} ministério(s)</Badge>
                        )}
                        <div className="ml-auto sm:ml-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/acompanhamento?personId=${membro.id}`);
                              }}>
                                Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/acompanhamento?personId=${membro.id}`);
                              }}>
                                Acompanhamento
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>Remover</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
