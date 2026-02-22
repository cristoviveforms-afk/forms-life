import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MoreVertical,
    ChevronRight,
    Clock,
    CheckCircle2,
    PlayCircle,
    Plus,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ASSIGNEES = ["Maiza", "Eraldo", "Gracy"];
const STATUSES = [
    { value: "pendente", label: "Pendente", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
    { value: "fazendo", label: "Em Produção", icon: PlayCircle, color: "text-blue-500 bg-blue-500/10" },
    { value: "concluido", label: "Concluído", icon: CheckCircle2, color: "text-green-500 bg-green-500/10" },
];

export default function MediaBoard() {
    const [demands, setDemands] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newDemand, setNewDemand] = useState({
        description: "",
        assignee: "",
        event_id: "none"
    });

    const fetchDemands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("media_demands" as any)
                .select("*, media_events(title, event_date)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setDemands(data || []);
        } catch (error) {
            console.error("Error fetching demands:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const { data } = await supabase
                .from("media_events" as any)
                .select("id, title, event_date")
                .order("event_date", { ascending: false });
            setEvents(data || []);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    useEffect(() => {
        fetchDemands();
        fetchEvents();
    }, []);

    const updateStatus = async (demandId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("media_demands" as any)
                .update({ status: newStatus })
                .eq("id", demandId);

            if (error) throw error;
            toast.success("Status atualizado!");
            fetchDemands();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Erro ao atualizar status.");
        }
    };

    const handleAddDemand = async () => {
        if (!newDemand.description || !newDemand.assignee) {
            toast.error("Preencha a descrição e o responsável.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                description: newDemand.description,
                assignee: newDemand.assignee,
                event_id: newDemand.event_id === "none" ? null : newDemand.event_id,
                status: "pendente"
            };

            const { error } = await supabase
                .from("media_demands" as any)
                .insert([payload]);

            if (error) throw error;

            toast.success("Demanda adicionada!");
            setIsDialogOpen(false);
            setNewDemand({ description: "", assignee: "", event_id: "none" });
            fetchDemands();
        } catch (error) {
            console.error("Error adding demand:", error);
            toast.error("Erro ao adicionar demanda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ASSIGNEES.map((assignee) => (
                <div key={assignee} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                                {assignee[0]}
                            </div>
                            <h3 className="font-bold text-lg">{assignee}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-secondary/50">
                            {demands.filter((d) => d.assignee === assignee).length} Demandas
                        </Badge>
                    </div>

                    <ScrollArea className="h-[600px] rounded-xl border border-border/50 bg-background/50 p-4">
                        <div className="space-y-4">
                            {demands
                                .filter((d) => d.assignee === assignee)
                                .map((demand) => (
                                    <Card
                                        key={demand.id}
                                        className="group border-none shadow-sm hover:shadow-md transition-all bg-card/80 backdrop-blur-sm overflow-hidden"
                                    >
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className="text-[10px] bg-secondary/30">
                                                    {demand.media_events?.title || "Demanda Geral"}
                                                </Badge>
                                                <div className="flex gap-1">
                                                    {STATUSES.map((s) => (
                                                        <button
                                                            key={s.value}
                                                            onClick={() => updateStatus(demand.id, s.value)}
                                                            className={`p-1 rounded-md transition-colors ${demand.status === s.value
                                                                ? s.color
                                                                : "text-muted-foreground hover:bg-secondary"
                                                                }`}
                                                            title={s.label}
                                                        >
                                                            <s.icon className="h-3 w-3" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <CardTitle className="text-sm font-semibold mt-2 group-hover:text-primary transition-colors">
                                                {demand.description}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                                    <Clock className="h-3 w-3" />
                                                    {demand.media_events?.event_date ? new Date(demand.media_events.event_date).toLocaleDateString() : "Sem Prazo"}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                            {demands.filter((d) => d.assignee === assignee).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                                    <PlayCircle className="h-12 w-12 mb-3 stroke-[1px]" />
                                    <p className="text-sm">Sem demandas ativas.</p>
                                </div>
                            )}

                            <Button
                                onClick={() => {
                                    setNewDemand({ ...newDemand, assignee });
                                    setIsDialogOpen(true);
                                }}
                                variant="ghost"
                                className="w-full border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all h-24 flex-col gap-2 rounded-xl"
                            >
                                <Plus className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Adicionar Nova Demanda</span>
                            </Button>
                        </div>
                    </ScrollArea>
                </div>
            ))}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-card border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>Nova Demanda para {newDemand.assignee}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição da Tarefa</Label>
                            <Input
                                id="description"
                                placeholder="O que precisa ser feito?"
                                value={newDemand.description}
                                onChange={(e) => setNewDemand({ ...newDemand, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event_id">Vincular a um Evento (Opcional)</Label>
                            <Select
                                value={newDemand.event_id}
                                onValueChange={(val) => setNewDemand({ ...newDemand, event_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um evento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum evento (Geral)</SelectItem>
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={event.id}>
                                            {event.title} ({new Date(event.event_date).toLocaleDateString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddDemand} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Demanda
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
