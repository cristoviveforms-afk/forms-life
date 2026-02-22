import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LayoutDashboard, Users } from "lucide-react";
import CalendarView from "./CalendarView";
import MediaBoard from "./MediaBoard";
import { MediaScales } from "./MediaScales";

interface MidiaProps {
    defaultTab?: string;
    hideTabs?: boolean;
}

export default function Midia({ defaultTab = "calendario", hideTabs = false }: MidiaProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const getTabDescription = () => {
        switch (activeTab) {
            case 'calendario': return 'Gerencie o calendário de eventos.';
            case 'quadro': return 'Gerencie as demandas da equipe de mídia.';
            case 'escala': return 'Gerencie a escala mensal de voluntários.';
            default: return '';
        }
    };

    return (
        <DashboardLayout title="Mídia">
            <div className="space-y-6 animate-fade-in p-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Comunicação & Mídia</h2>
                        <p className="text-muted-foreground">
                            {getTabDescription()}
                        </p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {!hideTabs && (
                        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                            <TabsTrigger value="calendario" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Calendário</span>
                            </TabsTrigger>
                            <TabsTrigger value="quadro" className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Quadro</span>
                            </TabsTrigger>
                            <TabsTrigger value="escala" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Escala Mensal</span>
                            </TabsTrigger>
                        </TabsList>
                    )}

                    <div className={hideTabs ? "" : "mt-6"}>
                        <TabsContent value="calendario">
                            <CalendarView />
                        </TabsContent>
                        <TabsContent value="quadro">
                            <MediaBoard />
                        </TabsContent>
                        <TabsContent value="escala">
                            <MediaScales />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
