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
        .from('people' as any)
        .select('*')
        .eq('type', type);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info(`Nenhum ${type} encontrado para exportar`);
        return;
      }

      // Simple CSV export
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row: any) => Object.values(row).map(val => `"${val}"`).join(','));
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
        <div className="bg-card border rounded-sm overflow-hidden mb-6">
          <div className="p-6 border-b bg-card/50">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">Perfil</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
          </div>
          <div className="p-6 space-y-4 bg-card/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Nome</Label>
                <Input
                  id="nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={email} disabled className="bg-muted rounded-sm" />
              </div>
            </div>
            <Button onClick={handleUpdateProfile} disabled={loadingProfile} className="rounded-sm font-bold uppercase tracking-widest text-xs h-10 px-6 mt-4">
              {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-card border rounded-sm overflow-hidden mb-6">
          <div className="p-6 border-b bg-card/50">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">Segurança</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Altere sua senha de acesso</p>
          </div>
          <div className="p-6 space-y-4 bg-card/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nova_senha" className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Nova Senha</Label>
                <Input
                  id="nova_senha"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="rounded-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar_senha" className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Confirmar Nova Senha</Label>
                <Input
                  id="confirmar_senha"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="rounded-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <Button onClick={handleUpdatePassword} disabled={loadingPassword} className="rounded-sm font-bold uppercase tracking-widest text-xs h-10 px-6 mt-4">
              {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </div>
        </div>

        {/* Dados */}
        <div className="bg-card border rounded-sm overflow-hidden mb-6">
          <div className="p-6 border-b bg-card/50">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">Dados</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Exporte os dados do sistema</p>
          </div>
          <div className="p-6 space-y-4 bg-card/30">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleExport('membro')} className="rounded-sm font-bold uppercase tracking-widest text-xs h-10 px-4">
                <Download className="mr-2 h-4 w-4" />
                Exportar Membros (CSV)
              </Button>
              <Button variant="outline" onClick={() => handleExport('visitante')} className="rounded-sm font-bold uppercase tracking-widest text-xs h-10 px-4">
                <Download className="mr-2 h-4 w-4" />
                Exportar Visitantes (CSV)
              </Button>
            </div>
          </div>
        </div>

        {/* Notificações (Placeholder) */}
        <div className="bg-card border rounded-sm overflow-hidden opacity-60">
          <div className="p-6 bg-card/50">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">Notificações</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Em breve</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
