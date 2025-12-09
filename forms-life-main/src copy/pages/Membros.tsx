import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockMembros = [
  { id: 1, nome: 'Maria Silva', telefone: '(11) 99999-1234', celula: 'Centro', batizado: true, servindo: true },
  { id: 2, nome: 'João Pedro Santos', telefone: '(11) 98888-5678', celula: 'Norte', batizado: true, servindo: false },
  { id: 3, nome: 'Ana Costa', telefone: '(11) 97777-9012', celula: 'Sul', batizado: false, servindo: true },
  { id: 4, nome: 'Carlos Oliveira', telefone: '(11) 96666-3456', celula: 'Centro', batizado: true, servindo: true },
  { id: 5, nome: 'Fernanda Lima', telefone: '(11) 95555-7890', celula: 'Leste', batizado: true, servindo: false },
];

export default function Membros() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredMembros = mockMembros.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="text-2xl font-bold">248</div>
              <p className="text-xs text-muted-foreground">Total de Membros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">215</div>
              <p className="text-xs text-muted-foreground">Batizados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">67</div>
              <p className="text-xs text-muted-foreground">Servindo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Células</p>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredMembros.map((membro) => (
                <div
                  key={membro.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                      {membro.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{membro.nome}</p>
                      <p className="text-sm text-muted-foreground">{membro.telefone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={membro.batizado ? 'default' : 'outline'}>
                      {membro.batizado ? 'Batizado' : 'Não Batizado'}
                    </Badge>
                    {membro.servindo && (
                      <Badge variant="secondary">Servindo</Badge>
                    )}
                    <Badge variant="outline">{membro.celula}</Badge>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
