import { useState, useEffect, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from 'lucide-react';
import { toast } from "sonner";

interface KeywordProtectedProps {
    children: ReactNode;
}

const KEYWORD = "mcv1234";
const STORAGE_KEY = "pastoral_access_granted";

export function KeywordProtected({ children }: KeywordProtectedProps) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [inputKeyword, setInputKeyword] = useState("");

    useEffect(() => {
        const access = sessionStorage.getItem(STORAGE_KEY);
        if (access === "true") {
            setIsAuthorized(true);
        }
    }, []);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKeyword === KEYWORD) {
            sessionStorage.setItem(STORAGE_KEY, "true");
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
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Área Restrita</CardTitle>
                    <CardDescription>
                        Esta área é exclusiva para a liderança pastoral.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Digite a palavra-chave..."
                                value={inputKeyword}
                                onChange={(e) => setInputKeyword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Desbloquear Acesso
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
