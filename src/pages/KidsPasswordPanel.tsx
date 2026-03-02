import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, Users, Bell } from 'lucide-react';

interface AlertRecord {
    security_code: string;
    observations?: string;
    child?: { full_name: string };
    responsible?: { full_name: string; phone: string };
}

export default function KidsPasswordPanel() {
    const [alerts, setAlerts] = useState<AlertRecord[]>([]);

    const fetchAlerts = async () => {
        const { data, error } = await supabase
            .from('kids_checkins' as any)
            .select(`
                security_code,
                observations,
                child:child_id(full_name),
                responsible:responsible_id(full_name, phone)
            `)
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
            <div className="w-full max-w-7xl flex justify-between items-center mb-12 border-b border-white/10 pb-8">
                <div className="flex items-center gap-6">
                    <div className="bg-rose-600 p-6 rounded-sm animate-pulse">
                        <ShieldAlert size={64} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-6xl tracking-tighter uppercase font-black">Chamada Kids</h1>
                        <p className="text-2xl text-slate-400 font-bold tracking-wide">Solicitamos a presença dos responsáveis no Ministério Infantil</p>
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
                                className="bg-zinc-900 border border-rose-600/50 rounded-sm p-10 flex flex-col items-center justify-center animate-in zoom-in-50 duration-500"
                            >
                                <div className="text-[8rem] font-black leading-none mb-2 text-white drop-shadow-sm">
                                    {alert.security_code}
                                </div>
                                <div className="flex items-center gap-3 text-rose-500 text-xl mb-6">
                                    <Bell className="animate-bounce" size={24} />
                                    <span className="font-bold">RESPONSÁVEL SOLICITADO</span>
                                </div>

                                <div className="w-full space-y-2 border-t border-rose-600/20 pt-6">
                                    <div className="text-center">
                                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Criança</p>
                                        <p className="text-2xl text-white font-bold uppercase truncate px-2">
                                            {alert.child?.full_name || 'NÃO IDENTIFICADA'}
                                        </p>
                                    </div>
                                    {/* Responsável */}
                                    <div className="flex flex-col items-center gap-1 mt-3">
                                        <span className="text-xl text-slate-500 uppercase tracking-widest font-bold">Responsável</span>
                                        <span className="text-3xl text-slate-200 font-bold">{alert.responsible?.full_name || 'NÃO IDENTIFICADO'}</span>
                                        <span className="text-2xl text-rose-500 font-bold">{alert.responsible?.phone || '(00) 00000-0000'}</span>
                                    </div>

                                    {/* Observações Cruciais */}
                                    {alert.observations && (
                                        <div className="mt-6 w-full bg-rose-500/10 border border-rose-500/30 p-4 rounded-sm animate-pulse">
                                            <div className="flex items-center justify-center gap-2 text-rose-500 mb-1">
                                                <Bell size={24} className="fill-rose-500" />
                                                <span className="text-xl uppercase tracking-widest font-bold">Observações Médicas/Urgentes</span>
                                            </div>
                                            <p className="text-xl font-bold text-white text-center leading-tight">{alert.observations}</p>
                                        </div>
                                    )}
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
