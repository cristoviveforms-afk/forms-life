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
              className="pl-9 rounded-sm focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-sm">
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 bg-card border rounded-sm border-l-4 border-l-primary/50">
            <div className="text-3xl font-light">{loading ? '-' : stats.total}</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Total de Convertidos</p>
          </div>
          <div className="p-6 bg-card border rounded-sm border-l-4 border-l-primary/50">
            <div className="text-3xl font-light">{loading ? '-' : stats.esteMes}</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Este Mês</p>
          </div>
          <div className="p-6 bg-card border rounded-sm border-l-4 border-l-primary/50">
            <div className="text-3xl font-light">{loading ? '-' : stats.acompanhamento}</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Querem Acompanhamento</p>
          </div>
          <div className="p-6 bg-card border rounded-sm border-l-4 border-l-primary/50">
            <div className="text-3xl font-light">{loading ? '-' : stats.integrados}</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Integrados</p>
          </div>
        </div>

        {/* Converts List */}
        <div className="bg-card border rounded-sm overflow-hidden min-h-[400px]">
          <div className="p-4 border-b">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Lista de Novos Convertidos</h2>
          </div>
          <div className="p-4 bg-muted/10 h-full">
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
                      className="flex items-center justify-between p-4 bg-card rounded-sm border hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
                          <Heart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">{convertido.full_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Conversão: {convertido.conversion_date ? new Date(convertido.conversion_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={convertido.convert_wants_accompaniment ? 'default' : 'outline'} className="rounded-sm text-[10px] uppercase font-bold tracking-wider">
                          {convertido.convert_wants_accompaniment ? 'Com Acompanhamento' : 'Sem Acompanhamento'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
