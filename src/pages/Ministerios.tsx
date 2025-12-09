import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Users, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { Ministry } from '@/types/database';
import { toast } from 'sonner';

export default function Ministerios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ministerios, setMinisterios] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // NewMinistry Form State
  const [newMinistry, setNewMinistry] = useState({
    name: '',
    leader: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMinisterios();
  }, []);

  const fetchMinisterios = async () => {
    try {
      const { data, error } = await supabase
        .from('ministries' as any)
        .select('*')
        .order('name');

      if (error) throw error;
      setMinisterios(data as unknown as Ministry[]);
    } catch (error) {
      console.error('Erro ao buscar ministérios:', error);
      toast.error('Erro ao carregar ministérios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMinistry = async () => {
    if (!newMinistry.name) {
      toast.error('Nome do ministério é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ministries' as any)
        .insert([
          {
            name: newMinistry.name,
            leader: newMinistry.leader,
            description: newMinistry.description
          }
        ] as any);

      if (error) throw error;

      toast.success('Ministério criado com sucesso!');
      setNewMinistry({ name: '', leader: '', description: '' });
      setIsDialogOpen(false);
      fetchMinisterios();
    } catch (error) {
      console.error('Erro ao criar ministério:', error);
      toast.error('Erro ao criar ministério');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMinisterios = ministerios.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Ministérios">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ministérios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ministério
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Ministério</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Ministério</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Louvor e Adoração"
                    value={newMinistry.name}
                    onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lider">Líder</Label>
                  <Input
                    id="lider"
                    placeholder="Nome do líder"
                    value={newMinistry.leader}
                    onChange={(e) => setNewMinistry({ ...newMinistry, leader: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    placeholder="Descrição do ministério"
                    value={newMinistry.description}
                    onChange={(e) => setNewMinistry({ ...newMinistry, description: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateMinistry} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Criar Ministério
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : ministerios.length}</div>
              <p className="text-xs text-muted-foreground">Total de Ministérios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{loading ? '-' : ministerios.filter(m => m.active).length}</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Ministry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            filteredMinisterios.map((ministerio) => (
              <Card key={ministerio.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{ministerio.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Líder:</span>{' '}
                      <span className="font-medium">{ministerio.leader || '-'}</span>
                    </div>
                    {ministerio.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{ministerio.description}</p>
                    )}
                    <Badge variant={ministerio.active ? 'default' : 'secondary'}>
                      {ministerio.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
