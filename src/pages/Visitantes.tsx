import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, MoreHorizontal, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockVisitantes = [
  { id: 1, nome: 'Pedro Almeida', telefone: '(11) 99111-2222', data: '2024-01-15', primeiraVez: true, contato: true },
  { id: 2, nome: 'Lucia Ferreira', telefone: '(11) 98222-3333', data: '2024-01-14', primeiraVez: true, contato: false },
  { id: 3, nome: 'Roberto Souza', telefone: '(11) 97333-4444', data: '2024-01-12', primeiraVez: false, contato: true },
  { id: 4, nome: 'Patricia Nunes', telefone: '(11) 96444-5555', data: '2024-01-10', primeiraVez: true, contato: true },
];

export default function Visitantes() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredVisitantes = mockVisitantes.filter((v) =>
    v.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Visitantes">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar visitantes..."
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
            <Button onClick={() => navigate('/cadastro?tipo=visitante')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Visitante
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">Total de Visitantes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Esta Semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">Primeira Vez</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">Aguardando Contato</p>
            </CardContent>
          </Card>
        </div>

        {/* Visitors List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Visitantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredVisitantes.map((visitante) => (
                <div
                  key={visitante.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                      {visitante.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{visitante.nome}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {visitante.telefone}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {visitante.primeiraVez && (
                      <Badge>Primeira Vez</Badge>
                    )}
                    <Badge variant={visitante.contato ? 'secondary' : 'outline'}>
                      {visitante.contato ? 'Contactado' : 'Aguardando'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                        <DropdownMenuItem>Registrar Contato</DropdownMenuItem>
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
