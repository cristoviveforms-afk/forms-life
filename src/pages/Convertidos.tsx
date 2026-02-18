import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Heart, Loader2 } from 'lucide-react';
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

export default function Convertidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [convertidos, setConvertidos] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDateChange = (start: string, end: string) => {
    fetchConvertidos(start, end);
  };

  const fetchConvertidos = async (start: string, end: string) => {
    setLoading(true);
    try {
      const startDay = `${start}T00:00:00`;
      const endDay = `${end}T23:59:59`;

      const { data, error } = await supabase
        .from('people' as any)
        .select('*')
        .eq('type', 'convertido' as any)
        .or(`and(conversion_date.gte.${start},conversion_date.lte.${end}),and(conversion_date.is.null,created_at.gte.${startDay},created_at.lte.${endDay})`);


      if (error) throw error;
      setConvertidos(data as unknown as Person[]);
    } catch (error) {
      console.error('Erro ao buscar convertidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConvertidos = convertidos.filter((c) =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: convertidos.length,
    esteMes: convertidos.filter(c => {
      if (!c.conversion_date) return false;
      const date = new Date(c.conversion_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    acompanhamento: convertidos.filter(c => c.convert_wants_accompaniment).length,
    integrados: 0,
  };

  return (
    <DashboardLayout title="Novos Convertidos">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <MonthYearPicker onDateChange={handleDateChange} />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar convertidos..."
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

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.total}</div>
              <p className="text-xs text-muted-foreground">Total de Convertidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.esteMes}</div>
              <p className="text-xs text-muted-foreground">Este Mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.acompanhamento}</div>
              <p className="text-xs text-muted-foreground">Querem Acompanhamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : stats.integrados}</div>
              <p className="text-xs text-muted-foreground">Integrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Converts List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Novos Convertidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConvertidos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum convertido encontrado.</p>
                ) : (
                  filteredConvertidos.map((convertido) => (
                    <div
                      key={convertido.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Heart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{convertido.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Conversão: {convertido.conversion_date ? new Date(convertido.conversion_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={convertido.convert_wants_accompaniment ? 'default' : 'outline'}>
                          {convertido.convert_wants_accompaniment ? 'Com Acompanhamento' : 'Sem Acompanhamento'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Iniciar Acompanhamento</DropdownMenuItem>
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
