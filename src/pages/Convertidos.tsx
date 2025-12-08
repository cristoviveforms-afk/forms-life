import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockConvertidos = [
  { id: 1, nome: 'Lucas Martins', telefone: '(11) 99888-1111', dataConversao: '2024-01-10', acompanhamento: 'em_andamento' },
  { id: 2, nome: 'Juliana Rocha', telefone: '(11) 98777-2222', dataConversao: '2024-01-08', acompanhamento: 'pendente' },
  { id: 3, nome: 'Rafael Mendes', telefone: '(11) 97666-3333', dataConversao: '2024-01-05', acompanhamento: 'concluido' },
  { id: 4, nome: 'Camila Santos', telefone: '(11) 96555-4444', dataConversao: '2024-01-03', acompanhamento: 'em_andamento' },
];

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  pendente: 'outline',
  em_andamento: 'secondary',
  concluido: 'default',
};

export default function Convertidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredConvertidos = mockConvertidos.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Novos Convertidos">
      <div className="space-y-6 animate-fade-in">
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
            <Button onClick={() => navigate('/cadastro?tipo=convertido')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Convertido
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">Total de Convertidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Este Mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Em Acompanhamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">12</div>
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
            <div className="space-y-2">
              {filteredConvertidos.map((convertido) => (
                <div
                  key={convertido.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{convertido.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Conversão: {new Date(convertido.dataConversao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariants[convertido.acompanhamento]}>
                      {statusLabels[convertido.acompanhamento]}
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
