import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { User, Lock, Bell, Database, Users } from 'lucide-react';

export default function Configuracoes() {
  const { user } = useAuth();

  const handleSave = () => {
    toast({
      title: 'Configurações salvas',
      description: 'Suas alterações foram salvas com sucesso.',
    });
  };

  return (
    <DashboardLayout title="Configurações">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Perfil</CardTitle>
            </div>
            <CardDescription>Gerencie suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>
            </div>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Segurança</CardTitle>
            </div>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha_atual">Senha Atual</Label>
              <Input id="senha_atual" type="password" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nova_senha">Nova Senha</Label>
                <Input id="nova_senha" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar_senha">Confirmar Nova Senha</Label>
                <Input id="confirmar_senha" type="password" />
              </div>
            </div>
            <Button onClick={handleSave}>Alterar Senha</Button>
          </CardContent>
        </Card>

        {/* Administradores */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Administradores</CardTitle>
            </div>
            <CardDescription>Gerencie os usuários com acesso ao sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { nome: 'Administrador', email: 'admin@cristovive.com' },
                { nome: 'Pastor', email: 'pastor@cristovive.com' },
              ].map((admin, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{admin.nome}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                  <Button variant="outline" size="sm">Remover</Button>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-4">
              <p className="text-sm font-medium">Adicionar novo administrador</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Nome" />
                <Input placeholder="Email" type="email" />
                <Button>Adicionar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notificações</CardTitle>
            </div>
            <CardDescription>Configure as notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configurações de notificações estarão disponíveis em breve.
            </p>
          </CardContent>
        </Card>

        {/* Dados */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Dados</CardTitle>
            </div>
            <CardDescription>Exporte os dados do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Exportar Membros (Excel)</Button>
              <Button variant="outline">Exportar Visitantes (Excel)</Button>
              <Button variant="outline">Relatório Geral (PDF)</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
