import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-8xl font-black text-primary/10 tracking-tighter">404</h1>
        <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Página não encontrada</p>
        <a href="/" className="inline-block mt-8 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
          Retornar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
