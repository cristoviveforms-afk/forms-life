import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Heart,
  Building2,
  Settings,
  LogOut,
  Home,
  Calendar,
  Cake,
  HeartHandshake,
  ClipboardList,
  Shield,
  Puzzle,
  Wallet,
  Baby,
  ChevronRight
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo_igreja.png';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Boas-Vindas', url: '/boas-vindas', icon: HeartHandshake },
  { title: 'Conexão', url: '/conexao', icon: Puzzle },
  { title: 'Membros', url: '/membros', icon: Users },
  { title: 'Visitantes', url: '/visitantes', icon: UserPlus },
  { title: 'Novos Convertidos', url: '/convertidos', icon: Heart },
  { title: 'Ministérios', url: '/ministerios', icon: Building2 },
  { title: 'Acompanhamento', url: '/acompanhamento', icon: ClipboardList },
  { title: 'Financeiro', url: '/financeiro', icon: Wallet },
  { title: 'Aniversariantes', url: '/aniversariantes', icon: Cake },
];

const kidsMenuItems = [
  { title: "Painel do Líder", url: "/kids-dashboard", icon: Baby },
  { title: "Check-in", url: "/kids-checkin", icon: Baby },
  { title: "Portal dos Pais", url: "/kids-parent-portal", icon: Baby },
  { title: "Painel do Telão", url: "/kids-password-panel", icon: Baby },
];


const bottomItems = [
  { title: 'Avaliação', url: '/public/avaliacao', icon: Heart, external: true, badge: 'Novo' },
  { title: 'Área Pastoral', url: '/pastoral', icon: Shield },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar className={`border-r border-sidebar-border ${className}`}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Forms Cristo Vive</span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user?.name}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="cursor-pointer"
                  >
                    <a
                      onClick={() => navigate(item.url)}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Kids Collapsible Menu */}
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Kids">
                      <Baby className="h-4 w-4" />
                      <span>Kids</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {kidsMenuItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a
                              href={subItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="cursor-pointer"
                  >
                    <a
                      href={item.url}
                      target={(item as any).external ? "_blank" : "_self"}
                      rel={(item as any).external ? "noopener noreferrer" : ""}
                      onClick={(e) => {
                        if ((item as any).external) return;
                        e.preventDefault();
                        navigate(item.url);
                      }}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {(item as any).badge && (
                        <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                          {(item as any).badge}
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <SidebarMenuButton
                  className="cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você precisará fazer login novamente para acessar o sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
