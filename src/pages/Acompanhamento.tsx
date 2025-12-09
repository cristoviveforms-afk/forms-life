import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, MoreHorizontal, Phone, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Accompaniment, Person } from '@/types/database';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pendente: 'destructive',
  em_andamento: 'secondary',
  concluido: 'default',
};

export default function Acompanhamento() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [acompanhamentos, setAcompanhamentos] = useState<Accompaniment[]>([]);
  const [loading, setLoading] = useState(true);

  // State for creating new accompaniment
  const [people, setPeople] = useState<Person[]>([]);
  const [newAccomp, setNewAccomp] = useState({
    person_id: '',
    type: '',
    observacoes: '',
    status: 'pendente'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAcompanhamentos();
    fetchPeople();
  }, []);

  const fetchAcompanhamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('accompaniments')
        .select(`
          *,
          people (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAcompanhamentos(data as Accompaniment[]);
    } catch (error) {
      console.error('Erro ao buscar acompanhamentos:', error);
      toast.error('Erro ao carregar acompanhamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeople = async () => {
    try {
      const { data } = await supabase
        .from('people')
        .select('*')
        .order('name');
      if (data) setPeople(data as Person[]);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
    }
  };

  const handleCreate = async () => {
    if (!newAccomp.person_id || !newAccomp.type) {
      toast.error('Pessoa e tipo são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('accompaniments')
        .insert([{
          person_id: newAccomp.person_id,
          type: newAccomp.type,
          observacoes: newAccomp.observacoes,
          status: newAccomp.status,
          last_contact_date: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Acompanhamento registrado!');
      setIsDialogOpen(false);
      setNewAccomp({ person_id: '', type: '', observacoes: '', status: 'pendente' });
      fetchAcompanhamentos();
    } catch (error) {
      console.error('Erro ao criar acompanhamento:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAcompanhamentos = acompanhamentos.filter((a) =>
    a.people?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendentes = acompanhamentos.filter((a) => a.status === 'pendente').length;
  const emAndamento = acompanhamentos.filter((a) => a.status === 'em_andamento').length;

  return (
    <DashboardLayout title="Acompanhamento">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar acompanhamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Acompanhamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Acompanhamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="pessoa">Pessoa</Label>
                  <Select
                    value={newAccomp.person_id}
                    onValueChange={(val) => setNewAccomp({ ...newAccomp, person_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pessoa" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Contato</Label>
                  <Select
                    value={newAccomp.type}
                    onValueChange={(val) => setNewAccomp({ ...newAccomp, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ligação">Ligação</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Visita Pastoral">Visita Pastoral</SelectItem>
                      <SelectItem value="Presencial">Presencial na Igreja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Detalhes do acompanhamento..."
                    value={newAccomp.observacoes}
                    onChange={(e) => setNewAccomp({ ...newAccomp, observacoes: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : acompanhamentos.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{loading ? '-' : pendentes}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : emAndamento}</div>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : acompanhamentos.filter(a => a.status === 'concluido').length}</div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
        </div>

        {/* Follow-up List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Acompanhamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAcompanhamentos.map((acomp) => (
                  <div
                    key={acomp.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                        {acomp.people?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{acomp.people?.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{acomp.type}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {acomp.last_contact_date ? new Date(acomp.last_contact_date).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[acomp.status] as any}>
                        {statusLabels[acomp.status]}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                          <DropdownMenuItem>Registrar Contato</DropdownMenuItem>
                          <DropdownMenuItem>Marcar como Concluído</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Encerrar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
