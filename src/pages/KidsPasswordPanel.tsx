import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, Users, Bell } from 'lucide-react';

interface AlertRecord {
    security_code: string;
}

export default function KidsPasswordPanel() {
    const [alerts, setAlerts] = useState<AlertRecord[]>([]);

    const fetchAlerts = async () => {
        const { data, error } = await supabase
            .from('kids_checkins' as any)
            .select('security_code')
            .eq('status', 'alert');

        if (error) console.error('Error fetching alerts:', error);
        else setAlerts((data as any[]) || []);
    };

    useEffect(() => {
        fetchAlerts();

        const channel = supabase
            .channel('kids-alerts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kids_checkins' }, () => {
                fetchAlerts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center font-black">
            {/* Header Panel */}
            <div className="w-full max-w-7xl flex justify-between items-center mb-12 border-b-4 border-white/10 pb-8">
                <div className="flex items-center gap-6">
                    <div className="bg-rose-600 p-6 rounded-[30px] animate-pulse">
                        <ShieldAlert size={64} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-6xl tracking-tighter uppercase">Chamada Kids</h1>
                        <p className="text-2xl text-slate-400 font-medium tracking-wide">Solicitamos a presença dos responsáveis no Ministério Infantil</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-9xl text-rose-500">{alerts.length}</div>
                    <div className="text-xl uppercase tracking-widest text-slate-500">Alertas Ativos</div>
                </div>
            </div>

            {/* Codes Grid */}
            <div className="flex-1 w-full max-w-7xl">
                {alerts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className="bg-zinc-900 border-4 border-rose-600/50 rounded-[60px] p-16 flex flex-col items-center justify-center animate-in zoom-in-50 duration-500"
                            >
                                <div className="text-[12rem] leading-none mb-4 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                    {alert.security_code}
                                </div>
                                <div className="flex items-center gap-3 text-rose-500 text-3xl">
                                    <Bell className="animate-bounce" size={40} />
                                    <span>RESPONSÁVEL SOLICITADO</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <Users size={200} className="mb-8" />
                        <p className="text-5xl uppercase tracking-[0.5em]">Nenhum Alerta Ativo</p>
                    </div>
                )}
            </div>

            {/* Footer Branding */}
            <div className="mt-12 text-slate-700 text-sm uppercase tracking-widest">
                Sistema de Segurança Kids - Monitoramento em Tempo Real
            </div>
        </div>
    );
}
