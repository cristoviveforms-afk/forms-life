import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Lock, Bell, Database, Users, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Configuracoes() {
  const { user } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');

  // Password State
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const handleUpdateProfile = async () => {
    setLoadingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name }
      });

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;
      toast.success('Senha atualizada com sucesso!');
      setPasswords({ new: '', confirm: '' });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleExport = async (type: 'membro' | 'visitante') => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('type', type);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info(`Nenhum ${type} encontrado para exportar`);
        return;
      }

      // Simple CSV export
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
      const csvContent = [headers, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}s_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Exportação concluída!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar dados');
    }
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
                <Input
                  id="nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled className="bg-muted" />
              </div>
            </div>
            <Button onClick={handleUpdateProfile} disabled={loadingProfile}>
              {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nova_senha">Nova Senha</Label>
                <Input
                  id="nova_senha"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar_senha">Confirmar Nova Senha</Label>
                <Input
                  id="confirmar_senha"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleUpdatePassword} disabled={loadingPassword}>
              {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
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
              <Button variant="outline" onClick={() => handleExport('membro')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Membros (CSV)
              </Button>
              <Button variant="outline" onClick={() => handleExport('visitante')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Visitantes (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notificações (Placeholder) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notificações</CardTitle>
            </div>
            <CardDescription>Em breve</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
