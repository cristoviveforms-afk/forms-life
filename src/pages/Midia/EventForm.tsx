import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EventFormProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    onSuccess: () => void;
}

const MEDIA_NEEDS_OPTIONS = [
    { id: "foto", label: "Foto" },
    { id: "video", label: "Vídeo" },
    { id: "telao", label: "Telão" },
    { id: "stories", label: "Stories" },
];

const TONE_OPTIONS = [
    { value: "celebrativo", label: "Celebrativo" },
    { value: "quebrantado", label: "Quebrantado" },
    { value: "ensino", label: "Ensino" },
    { value: "evangelistico", label: "Evangelístico" },
];

export default function EventForm({
    isOpen,
    onClose,
    selectedDate,
    onSuccess,
}: EventFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        verse: "",
        cta: "",
        target_audience: "",
        responsible_name: "",
        responsible_contact: "",
        media_needs: [] as string[],
        central_message: "",
        tone: "",
        strategy: "pequeno",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;

        setLoading(true);
        try {
            const { data: event, error: eventError } = await supabase
                .from("media_events" as any)
                .insert([
                    {
                        event_date: selectedDate.toISOString().split("T")[0],
                        title: formData.title,
                        verse: formData.verse,
                        cta: formData.cta,
                        target_audience: formData.target_audience,
                        responsible_name: formData.responsible_name,
                        responsible_contact: formData.responsible_contact,
                        media_needs: formData.media_needs,
                        central_message: formData.central_message,
                        tone: formData.tone,
                        strategy: formData.strategy,
                    },
                ])
                .select()
                .single();

            if (eventError) throw eventError;

            // Logic for Passo 03: Evaluate requirements and create demands
            // This is a simplified version, Maiza/Eraldo/Gracy will evaluate later
            // But we can create default placeholders if it's a "grande" event
            if (formData.strategy === "grande") {
                const people = ["Maiza", "Eraldo", "Gracy"];
                const demands = people.map((person) => ({
                    event_id: event.id,
                    assignee: person,
                    description: "Avaliar demandas para o evento grande.",
                    status: "pendente",
                }));

                const { error: demandsError } = await supabase
                    .from("media_demands" as any)
                    .insert(demands);

                if (demandsError) throw demandsError;
            }

            toast.success("Evento criado com sucesso!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating event:", error);
            toast.error("Erro ao criar evento.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMediaNeed = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            media_needs: prev.media_needs.includes(id)
                ? prev.media_needs.filter((item) => item !== id)
                : [...prev.media_needs, id],
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Novo Evento/Culto - {selectedDate?.toLocaleDateString()}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Tema/Título Oficial</Label>
                            <Input
                                id="title"
                                required
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="Ex: Culto de Celebração"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="verse">Versículo Base (se houver)</Label>
                            <Input
                                id="verse"
                                value={formData.verse}
                                onChange={(e) =>
                                    setFormData({ ...formData, verse: e.target.value })
                                }
                                placeholder="Ex: João 3:16"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cta">CTA (O que o povo deve fazer?)</Label>
                            <Input
                                id="cta"
                                value={formData.cta}
                                onChange={(e) =>
                                    setFormData({ ...formData, cta: e.target.value })
                                }
                                placeholder="Inscrição, doação, voluntariado?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="audience">Público-alvo</Label>
                            <Input
                                id="audience"
                                value={formData.target_audience}
                                onChange={(e) =>
                                    setFormData({ ...formData, target_audience: e.target.value })
                                }
                                placeholder="Jovens, famílias, etc."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="resp_name">Responsável do Ministério</Label>
                            <Input
                                id="resp_name"
                                value={formData.responsible_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, responsible_name: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resp_contact">Contato</Label>
                            <Input
                                id="resp_contact"
                                value={formData.responsible_contact}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        responsible_contact: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Necessidades de Mídia</Label>
                        <div className="flex flex-wrap gap-4">
                            {MEDIA_NEEDS_OPTIONS.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={option.id}
                                        checked={formData.media_needs.includes(option.id)}
                                        onCheckedChange={() => toggleMediaNeed(option.id)}
                                    />
                                    <Label htmlFor={option.id} className="cursor-pointer">
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Mensagem Central (1 frase)</Label>
                        <Textarea
                            id="message"
                            value={formData.central_message}
                            onChange={(e) =>
                                setFormData({ ...formData, central_message: e.target.value })
                            }
                            placeholder="A ideia central do evento..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tom</Label>
                            <Select
                                onValueChange={(value) =>
                                    setFormData({ ...formData, tone: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tom" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TONE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tamanho do Evento</Label>
                            <Select
                                defaultValue="pequeno"
                                onValueChange={(value) =>
                                    setFormData({ ...formData, strategy: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pequeno">Pequeno (Semanal)</SelectItem>
                                    <SelectItem value="grande">Grande (Mensal)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Evento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
