import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/logo_igreja.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Erro no login',
        description: 'Email ou senha incorretos.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in bg-card border rounded-sm p-8 shadow-sm">
          <div className="text-center space-y-4 pb-8">
            <div className="mx-auto">
              <img
                src={logo}
                alt="Forms Cristo Vive"
                className="h-24 w-auto object-contain mx-auto"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight uppercase">Forms Cristo Vive</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Gestão de Membros
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <Button
                type="submit"
                className="w-full h-11 font-bold rounded-sm uppercase tracking-widest text-xs"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              <button
                type="button"
                className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueci minha senha
              </button>

              <div className="text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-4 border-t pt-6 w-full">
                Novo por aqui?{' '}
                <Link to="/signup" className="text-primary hover:underline font-black">
                  Criar conta
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>


    </div>
  );
}
