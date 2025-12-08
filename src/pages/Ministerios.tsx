import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Users } from 'lucide-react';
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

const mockMinisterios = [
  { id: 1, nome: 'Louvor e Adoração', membros: 15, lider: 'Maria Silva', ativo: true },
  { id: 2, nome: 'Mídia e Comunicação', membros: 8, lider: 'João Pedro', ativo: true },
  { id: 3, nome: 'Infantil', membros: 12, lider: 'Ana Costa', ativo: true },
  { id: 4, nome: 'Jovens', membros: 20, lider: 'Carlos Oliveira', ativo: true },
  { id: 5, nome: 'Intercessão', membros: 10, lider: 'Fernanda Lima', ativo: true },
  { id: 6, nome: 'Diaconia', membros: 6, lider: 'Roberto Souza', ativo: false },
];

export default function Ministerios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredMinisterios = mockMinisterios.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembrosServindo = mockMinisterios.reduce((acc, m) => acc + m.membros, 0);

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
                  <Input id="nome" placeholder="Ex: Louvor e Adoração" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lider">Líder</Label>
                  <Input id="lider" placeholder="Nome do líder" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" placeholder="Descrição do ministério" />
                </div>
                <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
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
              <div className="text-2xl font-bold">{mockMinisterios.length}</div>
              <p className="text-xs text-muted-foreground">Total de Ministérios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockMinisterios.filter(m => m.ativo).length}</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalMembrosServindo}</div>
              <p className="text-xs text-muted-foreground">Pessoas Servindo</p>
            </CardContent>
          </Card>
        </div>

        {/* Ministry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMinisterios.map((ministerio) => (
            <Card key={ministerio.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">{ministerio.nome}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Gerenciar Membros</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{ministerio.membros} membros</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Líder:</span>{' '}
                    <span className="font-medium">{ministerio.lider}</span>
                  </div>
                  <Badge variant={ministerio.ativo ? 'default' : 'secondary'}>
                    {ministerio.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
