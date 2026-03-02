import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, ExternalLink, Sparkles, UserPlus, HeartHandshake } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import './ParandoPorUm.css';

interface MemberNode {
    id: string;
    full_name: string;
    avatar_url: string | null;
    member_role: string | null;
    leader_id: string | null;
    status: string;
    children: MemberNode[];
}

export default function ParandoPorUm() {
    const [loading, setLoading] = useState(true);
    const [hierarchy, setHierarchy] = useState<MemberNode[]>([]);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<{ parentId: string | null, position: number | string } | null>(null);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            // Fetch all members to support search and build hierarchy
            const { data, error } = await supabase
                .from('people' as any)
                .select('id, full_name, avatar_url, member_role, leader_id, phone')
                .eq('type', 'membro');

            if (data) setAllMembers(data);

            if (error) throw error;

            // Build tree structure
            const members: MemberNode[] = (data || []).map(m => ({
                ...m,
                status: 'Discipulado Ativo', // Standard status as requested
                children: []
            }));

            const idMap = new Map<string, MemberNode>();
            members.forEach(m => idMap.set(m.id, m));

            const roots: MemberNode[] = [];
            members.forEach(m => {
                if (m.leader_id && idMap.has(m.leader_id)) {
                    idMap.get(m.leader_id)!.children.push(m);
                } else {
                    roots.push(m);
                }
            });

            setHierarchy(roots);
        } catch (err) {
            console.error('Error fetching hierarchy:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignMember = async (member: any, role: string) => {
        if (!selectedSlot) return;

        try {
            const { error } = await supabase
                .from('people' as any)
                .update({
                    leader_id: selectedSlot.parentId,
                    member_role: role
                })
                .eq('id', member.id);

            if (error) throw error;

            toast({
                title: 'Sucesso!',
                description: `${member.full_name} foi vinculado como ${role === 'lider' ? 'Líder' : 'Liderado'}.`,
            });

            setIsSearchModalOpen(false);
            setSearchQuery('');
            fetchHierarchy();
        } catch (err) {
            toast({
                title: 'Erro ao vincular',
                description: 'Não foi possível salvar o vínculo.',
                variant: 'destructive',
            });
        }
    };

    const handleUpdatePhoto = async (memberId: string, url: string) => {
        setIsUpdatingPhoto(true);
        try {
            const { error } = await supabase
                .from('people' as any)
                .update({ avatar_url: url })
                .eq('id', memberId);

            if (error) throw error;
            fetchHierarchy();
        } catch (err) {
            console.error('Error updating photo:', err);
        } finally {
            setIsUpdatingPhoto(false);
        }
    };

    const renderNode = (node: MemberNode, isRoot: boolean = false, depth: number = 0) => {
        if (depth > 10) return null; // Safety against infinite recursion
        const isLeader = node.member_role === 'lider';

        return (
            <div key={node.id} className={`member-node ${isRoot ? 'pastoral-node' : ''} ${isLeader ? 'leader-node' : 'disciple-node'}`}>
                <div className="avatar-wrapper">
                    <img
                        src={node.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(node.full_name || 'Membro')}&background=1e293b&color=d4af37`}
                        alt={node.full_name || ''}
                        className="avatar-circular"
                        onClick={() => navigate(`/acompanhamento?personId=${node.id}`)}
                    />
                    <div className="hover-card">
                        <button
                            className="view-profile-btn"
                            onClick={() => navigate(`/acompanhamento?personId=${node.id}`)}
                        >
                            Ver Perfil
                        </button>
                    </div>
                </div>
                <div className="member-info">
                    <p className="member-name">{node.full_name || 'Sem Nome'}</p>
                    <div className="flex items-center gap-2 justify-center">
                        <p className="member-status">{node.status}</p>
                        <button
                            className="text-[10px] text-amber-500/50 hover:text-amber-500 transition-colors"
                            onClick={() => {
                                const newUrl = prompt('Cole a URL da nova foto:', node.avatar_url || '');
                                if (newUrl !== null) handleUpdatePhoto(node.id, newUrl);
                            }}
                        >
                            [Trocar Foto]
                        </button>
                    </div>
                </div>

                {node.children.length > 0 ? (
                    <div className="generation-row">
                        {node.children.map(child => renderNode(child, false, depth + 1))}
                        {/* Option to add more to this level if it's Level 3+ */}
                        {!isRoot && (
                            <div className="empty-slot disciple-slot" onClick={() => { setSelectedSlot({ parentId: node.id, position: 'dynamic' }); setIsSearchModalOpen(true); }}>
                                <Plus className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                ) : (
                    /* If no children but it's a leader (Level 2), show one slot for Level 3 */
                    !isRoot && (
                        <div className="generation-row">
                            <div className="empty-slot disciple-slot" onClick={() => { setSelectedSlot({ parentId: node.id, position: 'dynamic' }); setIsSearchModalOpen(true); }}>
                                <Plus className="h-4 w-4" />
                            </div>
                        </div>
                    )
                )}
            </div>
        );
    };

    return (
        <DashboardLayout title="Ecossistema Parando por Um">
            <div className="parando-container">
                <div className="constellation-overlay" />

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                            <Sparkles className="h-3 w-3" />
                            Gestão de Discipulado
                        </div>
                        <h2 className="text-3xl font-light tracking-tight text-foreground mb-2">Parando por Um</h2>
                        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                            Visualização da estrutura de cuidado e acompanhamento da igreja.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Carregando Estrutura...</p>
                        </div>
                    ) : (
                        <div className="pyramid-wrapper">
                            {/* LEVEL 1: PASTORAL (TOP) */}
                            <div className="pyramid-level level-1">
                                {hierarchy.length > 0 ? (
                                    hierarchy.slice(0, 1).map(root => renderNode(root, true))
                                ) : (
                                    <div className="empty-slot pastoral-slot" onClick={() => { setSelectedSlot({ parentId: null, position: 0 }); setIsSearchModalOpen(true); }}>
                                        <Plus className="h-5 w-5" />
                                        <span>Definir Pastor</span>
                                    </div>
                                )}
                            </div>

                            {/* LEVEL 2: 10 LEADERS (GRID) */}
                            <div className="pyramid-level level-2 mt-16">
                                <div className="leaders-grid">
                                    {Array.from({ length: 10 }).map((_, i) => {
                                        const leader = hierarchy[0]?.children[i];
                                        return leader ? renderNode(leader) : (
                                            <div key={i} className="empty-slot leader-slot" onClick={() => { setSelectedSlot({ parentId: hierarchy[0]?.id || null, position: i }); setIsSearchModalOpen(true); }}>
                                                <Plus className="h-4 w-4" />
                                                <span>Líder {i + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search & Link Modal */}
                <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                    <DialogContent className="sm:max-w-[400px] rounded-sm border-border/50">
                        <DialogHeader>
                            <DialogTitle>Vincular ao Discipulado</DialogTitle>
                            <DialogDescription>
                                Selecione um membro para ocupar esta posição.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-2 space-y-4">
                            <Input
                                placeholder="Buscar membro..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="rounded-sm bg-muted/20 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/20"
                            />

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                {allMembers
                                    .filter(m => (m.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                    .slice(0, 5)
                                    .map(member => (
                                        <div
                                            key={member.id}
                                            className="w-full flex items-center gap-3 p-3 rounded-sm border border-border/20 bg-muted/5 hover:bg-muted/10 transition-all text-left"
                                        >
                                            <div className="h-9 w-9 rounded-full bg-muted overflow-hidden shrink-0">
                                                <img src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}`} alt="" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs truncate">{member.full_name}</p>
                                                <p className="text-[10px] text-muted-foreground">{member.phone || 'Sem telefone'}</p>
                                            </div>
                                            <div className="flex gap-1 items-center shrink-0">
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-2 text-[9px] font-bold rounded-sm uppercase tracking-widest"
                                                    onClick={() => handleAssignMember(member, 'lider')}
                                                >
                                                    Líder
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2 text-[9px] font-bold rounded-sm uppercase tracking-widest border-border/60"
                                                    onClick={() => handleAssignMember(member, 'liderado')}
                                                >
                                                    Liderado
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Footer Action */}
                <div className="footer-action">
                    <Button
                        className="add-disciple-btn"
                        onClick={() => setIsWelcomeModalOpen(true)}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Novo Discípulo
                    </Button>
                </div>

                {/* Welcome Modal */}
                <Dialog open={isWelcomeModalOpen} onOpenChange={setIsWelcomeModalOpen}>
                    <DialogContent className="sm:max-w-[500px] border-border/50 rounded-sm">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Iniciar Acompanhamento
                            </DialogTitle>
                            <DialogDescription className="pt-4 leading-relaxed text-sm text-muted-foreground">
                                "Ao adicionar um novo discípulo, você está assumindo o compromisso de caminhar junto, ensinar e inspirar. Vamos juntos fazer a diferença na vida de mais um!"
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pt-6">
                            <Button
                                variant="outline"
                                onClick={() => setIsWelcomeModalOpen(false)}
                                className="rounded-sm text-xs font-bold uppercase tracking-widest h-9"
                            >
                                Voltar
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsWelcomeModalOpen(false);
                                    navigate('/cadastro?tipo=membro');
                                }}
                                className="rounded-sm text-xs font-bold uppercase tracking-widest h-9"
                            >
                                Ir para Cadastro
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
}
