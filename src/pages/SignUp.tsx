import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo_igreja.png';

interface Ministry {
    id: string;
    name: string;
}

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [ministry, setMinistry] = useState('');
    const [leader, setLeader] = useState('');
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMinistries = async () => {
            const { data } = await supabase
                .from('ministries')
                .select('id, name')
                .eq('active', true)
                .order('name');

            if (data) {
                setMinistries(data);
            }
        };
        fetchMinistries();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ministry) {
            toast({
                title: 'Campo obrigatório',
                description: 'Selecione um ministério.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        const { success, error } = await signUp(email, password, name, ministry, leader);

        if (success) {
            toast({
                title: 'Conta criada!',
                description: 'Faça login para continuar.',
            });
            navigate('/login');
        } else {
            toast({
                title: 'Erro ao criar conta',
                description: error || 'Tente novamente.',
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
                <Card className="w-full max-w-md animate-fade-in border-border/50 shadow-lg">
                    <CardHeader className="text-center space-y-4 pb-2">
                        <div className="mx-auto">
                            <img
                                src={logo}
                                alt="Forms Cristo Vive"
                                className="h-24 w-auto object-contain mx-auto"
                            />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight">Criar Conta</h1>
                            <p className="text-sm text-muted-foreground">
                                Junte-se ao Sistema de Gestão
                            </p>
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Seu nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11"
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ministry">Ministério Principal</Label>
                                <Select value={ministry} onValueChange={setMinistry}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecione seu ministério" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ministries.map((m) => (
                                            <SelectItem key={m.id} value={m.name}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="leader">Líder Direto (Opcional)</Label>
                                <Input
                                    id="leader"
                                    type="text"
                                    placeholder="Nome do seu líder"
                                    value={leader}
                                    onChange={(e) => setLeader(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full h-11 font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Criando conta...' : 'Criar Conta'}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                Já tem uma conta?{' '}
                                <Link to="/login" className="text-primary hover:underline font-medium">
                                    Entrar
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </main>
        </div>
    );
}
