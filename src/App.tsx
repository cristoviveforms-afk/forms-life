import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { KeywordProtected } from "@/components/KeywordProtected";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Membros from "./pages/Membros";
import Visitantes from "./pages/Visitantes";
import Convertidos from "./pages/Convertidos";
import Ministerios from "./pages/Ministerios";
import Acompanhamento from "./pages/Acompanhamento";
import Pastoral from "./pages/Pastoral";
import Cadastro from "./pages/Cadastro";
import Aniversariantes from "./pages/Aniversariantes";
import Configuracoes from "./pages/Configuracoes";
import Avaliacao from "./pages/Avaliacao";
import ResultadosAvaliacao from "./pages/ResultadosAvaliacao";
import ParandoPorUm from "./pages/ParandoPorUm";
import NotFound from "./pages/NotFound";
import Midia from "./pages/Midia";

import BoasVindas from './pages/BoasVindas';
import Conexao from './pages/Conexao';
import Financeiro from './pages/Financeiro';
import KidsCheckin from './pages/KidsCheckin';
import KidsDashboard from './pages/KidsDashboard';
import KidsParentPortal from './pages/KidsParentPortal';
import KidsPasswordPanel from './pages/KidsPasswordPanel';


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Analytics />
    <SpeedInsights />
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/kids-checkin" element={<KidsCheckin />} />
              <Route path="/kids-dashboard" element={<KidsDashboard />} />
              <Route path="/kids-parent-portal" element={<KidsParentPortal />} />
              <Route path="/kids-password-panel" element={<KidsPasswordPanel />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/pastoral" element={
                <ProtectedRoute>
                  <KeywordProtected>
                    <Pastoral />
                  </KeywordProtected>
                </ProtectedRoute>
              } />
              <Route path="/membros" element={<ProtectedRoute><Membros /></ProtectedRoute>} />
              <Route path="/visitantes" element={<ProtectedRoute><Visitantes /></ProtectedRoute>} />
              <Route path="/convertidos" element={<ProtectedRoute><Convertidos /></ProtectedRoute>} />
              <Route path="/ministerios" element={<ProtectedRoute><Ministerios /></ProtectedRoute>} />
              <Route path="/acompanhamento" element={<ProtectedRoute><Acompanhamento /></ProtectedRoute>} />
              <Route path="/aniversariantes" element={<ProtectedRoute><Aniversariantes /></ProtectedRoute>} />
              <Route path="/cadastro" element={<ProtectedRoute><Cadastro /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              <Route path="/avaliacao" element={<ProtectedRoute><Avaliacao /></ProtectedRoute>} />
              <Route path="/public/avaliacao" element={<Avaliacao isPublic={true} />} />
              <Route path="/pastoral/resultados-avaliacao" element={<ProtectedRoute><ResultadosAvaliacao /></ProtectedRoute>} />
              <Route path="/boas-vindas" element={<ProtectedRoute><BoasVindas /></ProtectedRoute>} />
              <Route path="/conexao" element={<ProtectedRoute><Conexao /></ProtectedRoute>} />
              <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
              <Route path="/kids-checkin" element={<ProtectedRoute><KidsCheckin /></ProtectedRoute>} />
              <Route path="/kids-dashboard" element={<ProtectedRoute><KidsDashboard /></ProtectedRoute>} />
              <Route path="/parando-por-um" element={<ProtectedRoute><ParandoPorUm /></ProtectedRoute>} />
              <Route path="/midia" element={<ProtectedRoute><Midia /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
// enabled Vercel Analytics
