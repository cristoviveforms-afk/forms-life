import { useEffect } from 'react';
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
  ChevronRight,
  Sparkles,
  Radio
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
  useSidebar,
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

const voluntariosItems = [
  {
    title: 'Boas-Vindas',
    icon: HeartHandshake,
    subItems: [
      { title: 'Visitantes', url: '/boas-vindas' },
      { title: 'Cadastro Inicial', url: '/cadastro?mode=boas-vindas&tipo=visitante' },
    ]
  },
  {
    title: 'Conexão',
    icon: Puzzle,
    subItems: [
      { title: 'Visitantes', url: '/conexao' },
      { title: 'Cadastro Final', url: '/cadastro?mode=conexao&tipo=visitante' },
      { title: 'Acompanhamento', url: '/acompanhamento' },
    ]
  },
];

const secretariaItems = [
  { title: 'Membros', url: '/membros', icon: Users },
  { title: 'Novos Convertidos', url: '/convertidos', icon: Heart },
  { title: 'Aniversariantes', url: '/aniversariantes', icon: Cake },
  { title: 'Financeiro', url: '/financeiro', icon: Wallet },
  { title: 'Ministérios', url: '/ministerios', icon: Building2 },
];

const discipuladoItems = [
  { title: 'Parando por Um', url: '/parando-por-um', icon: Sparkles },
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
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/dashboard')}
                  className="cursor-pointer"
                >
                  <a onClick={() => navigate('/dashboard')} className="flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Voluntários Group */}
              {voluntariosItems.map((group) => (
                <Collapsible key={group.title} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={group.title}>
                        <group.icon className="h-4 w-4" />
                        <span>{group.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(subItem.url)}
                            >
                              <a onClick={() => navigate(subItem.url)} className="cursor-pointer">
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}

              {/* Secretária Group */}
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Secretaria">
                      <Building2 className="h-4 w-4" />
                      <span>Secretaria</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {secretariaItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(item.url)}
                          >
                            <a onClick={() => navigate(item.url)} className="cursor-pointer">
                              <item.icon className="h-4 w-4 mr-2" />
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Ecossistema Group */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/parando-por-um')}
                  className="cursor-pointer"
                >
                  <a onClick={() => navigate('/parando-por-um')} className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Ecossistema</span>
                    <span className="ml-auto bg-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Premium</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Mídia Group */}
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Mídia & Comunicação">
                      <Radio className="h-4 w-4 text-emerald-500" />
                      <span>Mídia & Comunicação</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive('/midia/calendario')}>
                          <a onClick={() => navigate('/midia/calendario')} className="flex items-center gap-2 cursor-pointer">
                            <Calendar className="h-4 w-4" />
                            <span>Calendário Mensal</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive('/midia/quadro')}>
                          <a onClick={() => navigate('/midia/quadro')} className="flex items-center gap-2 cursor-pointer">
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Quadro de Mídia</span>
                            <Shield className="h-3 w-3 ml-auto text-amber-500" />
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive('/midia/escala')}>
                          <a onClick={() => navigate('/midia/escala')} className="flex items-center gap-2 cursor-pointer">
                            <Users className="h-4 w-4" />
                            <span>Escala Mensal</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

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
                          <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                            <a
                              onClick={() => navigate(subItem.url)}
                              className="flex items-center gap-2 cursor-pointer"
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
