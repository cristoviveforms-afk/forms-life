import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ptBR } from "date-fns/locale";
import EventForm from "./EventForm";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";

export default function CalendarView() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("media_events" as any)
                .select("*")
                .order("event_date", { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDateClick = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            setIsFormOpen(true);
        }
    };

    const eventsOnSelectedDate = events.filter(
        (e) => e.event_date === date?.toISOString().split("T")[0]
    );

    // Mark days with events on the calendar
    const eventDays = events.map((e) => new Date(e.event_date));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-md border-none bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Selecione uma Data
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-0 pb-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateClick}
                        locale={ptBR}
                        className="rounded-md border-none"
                        modifiers={{ hasEvent: eventDays }}
                        modifiersClassNames={{
                            hasEvent: "after:content-[''] after:block after:w-1 after:h-1 after:bg-primary after:rounded-full after:mx-auto after:mt-1",
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md border-none bg-gradient-to-br from-card to-secondary/20">
                <CardHeader className="border-b border-border/50 pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                            Eventos em {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : "..."}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {eventsOnSelectedDate.length} {eventsOnSelectedDate.length === 1 ? 'Evento' : 'Eventos'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <ScrollArea className="h-[400px] pr-4">
                        {eventsOnSelectedDate.length > 0 ? (
                            <div className="space-y-4">
                                {eventsOnSelectedDate.map((event) => (
                                    <div
                                        key={event.id}
                                        className="p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform origin-left transition-transform scale-y-0 group-hover:scale-y-100" />
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-lg text-primary">{event.title}</h3>
                                                <Badge
                                                    variant={event.strategy === "grande" ? "default" : "secondary"}
                                                    className="text-[10px]"
                                                >
                                                    {event.strategy === "grande" ? "Estratégia Grande" : "Estratégia Pequena"}
                                                </Badge>
                                            </div>

                                            {event.verse && (
                                                <p className="text-sm italic text-muted-foreground">
                                                    "{event.verse}"
                                                </p>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="h-5 px-1 bg-secondary/30">CTA</Badge>
                                                    <span>{event.cta || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{event.responsible_name || "N/A"}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {event.media_needs?.map((need: string) => (
                                                    <Badge key={need} variant="secondary" className="capitalize text-[10px] bg-primary/10 text-primary border-primary/20">
                                                        {need}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {event.tone && (
                                                <div className="mt-2 text-xs font-medium uppercase tracking-tight text-muted-foreground/80">
                                                    Tom: <span className="text-foreground">{event.tone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <div className="p-4 rounded-full bg-secondary/30">
                                    <CalendarIcon className="h-8 w-8 opacity-20" />
                                </div>
                                <p className="text-sm">Clique em uma data para ver os detalhes ou criar um evento.</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <EventForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                selectedDate={date || null}
                onSuccess={fetchEvents}
            />
        </div>
    );
}
