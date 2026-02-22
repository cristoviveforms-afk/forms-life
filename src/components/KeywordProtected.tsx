import { useState, useEffect, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from 'lucide-react';
import { toast } from "sonner";

interface KeywordProtectedProps {
    children: ReactNode;
    keyword: string;
    storageKey: string;
    title?: string;
    description?: string;
}

export function KeywordProtected({
    children,
    keyword,
    storageKey,
    title = "Área Restrita",
    description = "Esta área requer uma palavra-chave para acesso."
}: KeywordProtectedProps) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [inputKeyword, setInputKeyword] = useState("");

    useEffect(() => {
        const access = sessionStorage.getItem(storageKey);
        if (access === "true") {
            setIsAuthorized(true);
        }
    }, [storageKey]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKeyword === keyword) {
            sessionStorage.setItem(storageKey, "true");
            setIsAuthorized(true);
            toast.success("Acesso autorizado!");
        } else {
            toast.error("Palavra-chave incorreta.");
            setInputKeyword("");
        }
    };

    if (isAuthorized) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 shadow-2xl bg-card/80 backdrop-blur-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Lock className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUnlock} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Digite a palavra-chave..."
                                value={inputKeyword}
                                onChange={(e) => setInputKeyword(e.target.value)}
                                className="h-12 text-center text-lg tracking-widest bg-secondary/30"
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg font-semibold transition-all hover:scale-[1.02]">
                            Desbloquear Acesso
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
