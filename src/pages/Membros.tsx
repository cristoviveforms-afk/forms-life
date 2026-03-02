import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Loader2, ExternalLink, Link as LinkIcon, Check, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types/database';
import { toast } from '@/hooks/use-toast';

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
      const startDay = `${start}T00:00:00`;
      const endDay = `${end}T23:59:59`;

      const { data, error } = await supabase
        .from('people' as any)
        .select('*, leader:leader_id(full_name)')
        .eq('type', 'membro')
        .or(`and(integration_date.gte.${start},integration_date.lte.${end}),and(integration_date.is.null,created_at.gte.${startDay},created_at.lte.${endDay})`);

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
      <div className="space-y-6 p-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-light tracking-tight text-foreground">Membros</h2>
            <p className="text-sm text-muted-foreground">Gerencie os membros da igreja e seus ministérios.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const url = `${window.location.origin}/auto-cadastro`;
                navigator.clipboard.writeText(url);
                toast({
                  title: "Link Copiado!",
                  description: "O link de auto-cadastro foi copiado para a área de transferência.",
                });
              }}
              className="rounded-sm font-semibold border-primary/20 text-primary hover:bg-primary/5"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Link de Cadastro
            </Button>
            <Button variant="outline" size="icon" className="rounded-sm border-border/50 bg-background/50 hover:bg-background">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/cadastro?tipo=membro')} className="rounded-sm font-semibold shadow-none">
              <Plus className="h-4 w-4 mr-2" />
              Novo Membro
            </Button>
          </div>
        </div>

        <div className="w-full">
          <MonthYearPicker onDateChange={handleDateChange} />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 rounded-sm bg-muted/10 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-sm border-border/40 bg-muted/10 hover:bg-accent/50">
              <Filter className="h-4 w-4 opacity-70" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="p-4 rounded-sm border border-primary/20 bg-primary/5">
            <div className="text-2xl font-light tracking-tight text-primary">{loading ? '-' : stats.total}</div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Total</p>
          </div>
          <div className="p-4 rounded-sm border border-border/40 bg-card/30">
            <div className="text-2xl font-light tracking-tight">{loading ? '-' : stats.batizados}</div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Batizados</p>
          </div>
          <div className="p-4 rounded-sm border border-border/40 bg-card/30">
            <div className="text-2xl font-light tracking-tight">{loading ? '-' : stats.servindo}</div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Servindo</p>
          </div>
          <div className="p-4 rounded-sm border border-border/40 bg-card/30">
            <div className="text-2xl font-light tracking-tight">{loading ? '-' : stats.ministerios}</div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Ministérios</p>
          </div>
        </div>

        {/* Members List */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Lista de Membros</h3>
          </div>
          <div className="w-full">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMembros.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Nenhum membro encontrado.</p>
                ) : (
                  filteredMembros.map((membro) => (
                    <div
                      key={membro.id}
                      className="clean-list-item flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-sm border border-border/40 bg-card/20 hover:bg-accent/10 transition-colors cursor-pointer group gap-4"
                      onClick={() => navigate(`/acompanhamento?personId=${membro.id}`)}
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-muted/50 flex items-center justify-center font-bold text-muted-foreground text-sm group-hover:bg-primary/10 transition-colors overflow-hidden border border-border/20 group-hover:border-primary/20">
                          {membro.avatar_url ? (
                            <img src={membro.avatar_url} alt={membro.full_name} className="h-full w-full object-cover" />
                          ) : (
                            membro.full_name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col">
                            <p className="text-sm font-bold flex items-center gap-2 truncate text-foreground/90">
                              {membro.full_name}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0" />
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {membro.member_role && (
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${membro.member_role === 'Líder' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border/50'}`}>
                                  {membro.member_role}
                                </span>
                              )}
                              {membro.leader && (
                                <span className="text-[10px] text-muted-foreground opacity-80">
                                  Líder: {(membro.leader as any).full_name}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-1 opacity-80"><Phone className="h-3 w-3" /> {membro.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                        {membro.conversion_date && (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 border-emerald-600/30 bg-emerald-50 whitespace-nowrap rounded-sm shadow-none">
                            Novo Convertido
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider whitespace-nowrap rounded-sm shadow-none ${membro.baptized_water ? 'bg-muted/30 border-border/60 text-foreground/80' : 'bg-transparent border-dashed text-muted-foreground'}`}>
                          {membro.baptized_water ? 'Batizado' : 'Não Batizado'}
                        </Badge>
                        {membro.member_has_served && (
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground whitespace-nowrap rounded-sm shadow-none">Servindo</Badge>
                        )}
                        {membro.has_ministry && membro.ministries && membro.ministries.length > 0 && (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-border/50 bg-background/50 whitespace-nowrap rounded-sm shadow-none">{membro.ministries.length} ministério(s)</Badge>
                        )}
                        <div className="ml-auto sm:ml-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80 rounded-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-sm border-border/50 shadow-md">
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
          </div>
        </div>
      </div >
    </DashboardLayout >
  );
}
