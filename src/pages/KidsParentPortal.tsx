import { useState, useEffect } from 'react';
import {
    Baby,
    ShieldCheck,
    LogOut,
    Clock,
    Search,
    CheckCircle2,
    AlertCircle,
    Bell,
    Navigation,
    ArrowRight,
    ShieldAlert,
    Camera,
    ChevronLeft,
    ChevronRight,
    Search as SearchIcon
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface CheckinRecord {
    id: string;
    checkin_time: string;
    security_code: string;
    photos?: string[];
    children: {
        full_name: string;
    };
}

const PhotoSlideshow = ({ records }: { records: CheckinRecord[] }) => {
    const allPhotos = records.flatMap(r => r.photos || []);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
        });
    }, [emblaApi]);

    if (allPhotos.length === 0) return null;

    return (
        <div className="relative w-full overflow-hidden rounded-[40px] shadow-2xl bg-slate-900 border-4 border-white dark:border-slate-800 animate-in fade-in zoom-in duration-700">
            <div className="absolute top-6 left-8 z-20 flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                    <Camera className="h-4 w-4 text-white" />
                </div>
                <span className="text-white text-xs font-black uppercase tracking-widest drop-shadow-lg">Momentos de Hoje</span>
            </div>

            <div className="embla overflow-hidden" ref={emblaRef}>
                <div className="embla__container flex">
                    {allPhotos.map((photo, index) => (
                        <div key={index} className="embla__slide flex-[0_0_100%] min-w-0 relative aspect-[16/9]">
                            <img
                                src={photo}
                                alt={`Momento ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        </div>
                    ))}
                </div>
            </div>

            {allPhotos.length > 1 && (
                <>
                    <div className="absolute bottom-8 left-8 z-20 flex gap-2">
                        {allPhotos.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i === selectedIndex ? "w-8 bg-white" : "w-1.5 bg-white/30"}`}
                            />
                        ))}
                    </div>
                    <div className="absolute bottom-8 right-8 z-20 flex gap-3">
                        <button
                            onClick={() => emblaApi?.scrollPrev()}
                            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => emblaApi?.scrollNext()}
                            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default function KidsParentPortal() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [familyCheckins, setFamilyCheckins] = useState<CheckinRecord[]>([]);
    const [isLogged, setIsLogged] = useState(false);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!phone) return;
        setLoading(true);
        try {
            const cleanSearch = phone.replace(/\D/g, '');

            // Re-fetch with a more flexible query to handle existing formatted data
            const { data: people, error: fetchError } = await supabase
                .from('people')
                .select('id, cpf, phone');

            if (fetchError) throw fetchError;

            const parent = people.find(p => {
                const dbCpf = p.cpf?.replace(/\D/g, '');
                const dbPhone = p.phone?.replace(/\D/g, '');
                return dbCpf === cleanSearch || (cleanSearch.length >= 8 && dbPhone?.endsWith(cleanSearch.slice(-8)));
            });

            if (!parent) {
                toast({
                    title: "Não encontrado",
                    description: "Verifique o número/CPF ou procure a recepção do Kids.",
                    variant: "destructive"
                });
                return;
            }

            fetchActiveRecords(parent.id);
            setIsLogged(true);
        } catch (error) {
            console.error('Portal login error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveRecords = async (parentId: string) => {
        const { data, error } = await supabase
            .from('kids_checkins' as any)
            .select('id, checkin_time, security_code, status, photos, children:child_id(full_name)')
            .eq('responsible_id', parentId)
            .order('checkin_time', { ascending: false })
            .limit(10);

        if (error) console.error('Error fetching portals:', error);
        else setFamilyCheckins(data as any[] || []);
    };

    useEffect(() => {
        if (!isLogged) return;

        // Subscribe to changes for real-time alerts
        const channel = supabase
            .channel('parent-alerts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kids_checkins' }, () => {
                if (familyCheckins.length > 0) {
                    // Refetch using the parent id logic (implied by previous fetch)
                    // Simplify: we just rerender if anything changes, but better to target parent
                    handleSearch();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isLogged]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex flex-col items-center">

            {!isLogged ? (
                <div className="w-full max-w-md mt-20 animate-in fade-in slide-in-from-bottom-8">
                    <div className="text-center mb-10">
                        <div className="bg-primary/10 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="h-12 w-12 text-primary" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Acompanhamento Kids</h1>
                        <p className="text-slate-500 font-medium">Acompanhe seus filhos em tempo real</p>
                    </div>

                    <Card className="rounded-[40px] border-none shadow-2xl p-4">
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-3">
                                <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">CPF ou Telefone / WhatsApp</label>
                                <Input
                                    placeholder="CPF ou Telefone"
                                    className="h-16 text-xl rounded-3xl border-2 focus:ring-primary/20"
                                    value={phone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length === 11) {
                                            // Mask as CPF
                                            setPhone(val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
                                        } else if (val.length === 10 || val.length === 11) {
                                            // Mask as Phone
                                            if (val.length === 10) setPhone(`(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`);
                                            else setPhone(`(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`);
                                        } else {
                                            setPhone(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                className="w-full h-16 text-xl font-black rounded-3xl shadow-xl shadow-primary/20"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? "BRUSCANDO..." : "ACESSAR MEU PAINEL"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="w-full max-w-2xl space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black">Status da Família</h2>
                        <Button variant="ghost" className="rounded-2xl font-bold group" onClick={() => setIsLogged(false)}>
                            <LogOut className="h-4 w-4 mr-2 group-active:translate-x-1 transition-transform" /> Sair
                        </Button>
                    </div>

                    {/* Photo Slideshow Component */}
                    <PhotoSlideshow records={familyCheckins} />

                    {familyCheckins.length > 0 ? (
                        familyCheckins.map(record => (
                            <Card key={record.id} className="overflow-hidden border-none shadow-xl rounded-[32px] bg-white dark:bg-slate-900">
                                <CardContent className="p-0">
                                    <div className={`p-6 flex items-center justify-between ${record.status === 'alert' ? 'bg-rose-50 dark:bg-rose-950/30' :
                                        record.status === 'completed' ? 'bg-slate-50 dark:bg-slate-800/30' :
                                            'bg-white dark:bg-slate-900'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-4 rounded-2xl ${record.status === 'alert' ? 'bg-rose-600 text-white animate-pulse' :
                                                record.status === 'completed' ? 'bg-slate-200 text-slate-400' :
                                                    'bg-primary/10 text-primary'
                                                }`}>
                                                <Baby className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="font-black text-xl">{record.children.full_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        Entrada: {format(new Date(record.checkin_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {record.status === 'active' && (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black px-3 py-1 text-xs">EM SALA</Badge>
                                            )}
                                            {record.status === 'alert' && (
                                                <Badge className="bg-rose-600 text-white border-none font-black px-3 py-1 text-xs flex gap-1 items-center">
                                                    <Bell size={12} fill="currentColor" /> ALERTA
                                                </Badge>
                                            )}
                                            {record.status === 'completed' && (
                                                <Badge variant="outline" className="font-black px-3 py-1 text-xs">FINALIZADO</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {record.status !== 'completed' && (
                                        <div className="p-8 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center">
                                            <div className="flex-1 text-center md:text-left">
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">CÓDIGO DE SEGURANÇA</p>
                                                <p className="text-6xl font-black tracking-widest text-slate-900 dark:text-white">{record.security_code}</p>
                                            </div>

                                            {record.status === 'alert' && (
                                                <div className="bg-rose-100 dark:bg-rose-900/50 p-6 rounded-3xl flex items-center gap-4 w-full md:w-auto border-2 border-rose-200 animate-in zoom-in">
                                                    <ShieldAlert className="h-10 w-10 text-rose-600" />
                                                    <div className="text-left">
                                                        <p className="text-rose-900 dark:text-rose-100 font-black text-lg">Chamada Urgente</p>
                                                        <p className="text-rose-700 dark:text-rose-200 text-sm">Por favor, dirija-se ao Kids.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {record.status === 'active' && (
                                                <div className="bg-indigo-50 dark:bg-indigo-900/40 p-5 rounded-2xl flex items-center gap-3 w-full md:w-auto">
                                                    <CheckCircle2 className="text-indigo-600" />
                                                    <span className="text-indigo-900 dark:text-indigo-200 text-sm font-bold">A criança está segura e participando das atividades.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-30">
                            <Baby size={80} className="mx-auto mb-4" />
                            <p className="text-2xl font-black">Nenhum check-in recente</p>
                        </div>
                    )}

                    <div className="mt-10 bg-slate-900 text-white p-8 rounded-[40px] relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="bg-white/20 p-4 rounded-3xl">
                                <Navigation className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Dúvidas ou Suporte?</h3>
                                <p className="text-slate-400">Nossa equipe está à disposição na entrada do prédio.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
