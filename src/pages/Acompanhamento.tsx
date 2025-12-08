import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, MoreHorizontal, Phone, Calendar, MessageSquare } from 'lucide-react';
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

const mockAcompanhamentos = [
  { id: 1, pessoa: 'Lucas Martins', tipo: 'Novo Convertido', status: 'em_andamento', ultimoContato: '2024-01-15', observacoes: 'Precisa de discipulado' },
  { id: 2, pessoa: 'Juliana Rocha', tipo: 'Novo Convertido', status: 'pendente', ultimoContato: '2024-01-10', observacoes: 'Aguardando retorno' },
  { id: 3, pessoa: 'Pedro Almeida', tipo: 'Visitante', status: 'em_andamento', ultimoContato: '2024-01-14', observacoes: 'Interessado em conhecer a célula' },
  { id: 4, pessoa: 'Rafael Mendes', tipo: 'Novo Convertido', status: 'concluido', ultimoContato: '2024-01-12', observacoes: 'Integrado à célula Centro' },
];

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

  const filteredAcompanhamentos = mockAcompanhamentos.filter((a) =>
    a.pessoa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendentes = mockAcompanhamentos.filter((a) => a.status === 'pendente').length;
  const emAndamento = mockAcompanhamentos.filter((a) => a.status === 'em_andamento').length;

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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pessoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lucas">Lucas Martins</SelectItem>
                      <SelectItem value="juliana">Juliana Rocha</SelectItem>
                      <SelectItem value="pedro">Pedro Almeida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Contato</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ligacao">Ligação</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="visita">Visita Pastoral</SelectItem>
                      <SelectItem value="presencial">Presencial na Igreja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" placeholder="Detalhes do acompanhamento..." />
                </div>
                <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
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
              <div className="text-2xl font-bold">{mockAcompanhamentos.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{pendentes}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{emAndamento}</div>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockAcompanhamentos.filter(a => a.status === 'concluido').length}</div>
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
            <div className="space-y-2">
              {filteredAcompanhamentos.map((acomp) => (
                <div
                  key={acomp.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                      {acomp.pessoa.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{acomp.pessoa}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{acomp.tipo}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(acomp.ultimoContato).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[acomp.status]}>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
