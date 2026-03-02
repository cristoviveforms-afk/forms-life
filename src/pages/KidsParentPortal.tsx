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
        <div className="relative w-full overflow-hidden rounded-sm shadow-sm border animate-in fade-in zoom-in duration-700">
            <div className="absolute top-6 left-8 z-20 flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-sm border border-white/20">
                    <Camera className="h-4 w-4 text-white" />
                </div>
                <span className="text-white text-xs font-bold uppercase tracking-widest drop-shadow-lg">Momentos de Hoje</span>
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
                                className={`h-1.5 rounded-sm transition-all duration-500 ${i === selectedIndex ? "w-8 bg-white" : "w-1.5 bg-white/30"}`}
                            />
                        ))}
                    </div>
                    <div className="absolute bottom-8 right-8 z-20 flex gap-3">
                        <button
                            onClick={() => emblaApi?.scrollPrev()}
                            className="h-10 w-10 rounded-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => emblaApi?.scrollNext()}
                            className="h-10 w-10 rounded-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
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
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!phone) return;
        setLoading(true);
        try {
            const cleanSearch = phone.replace(/\D/g, '');

            if (cleanSearch.length < 4) {
                toast({
                    title: "Busca muito curta",
                    description: "Digite pelo menos os últimos 4 dígitos do seu telefone ou o CPF completo.",
                    variant: "destructive"
                });
                return;
            }

            // Otimizado: Busca direta no servidor apenas pelas colunas necessárias
            // Usamos .or para buscar por CPF ou Phone (contendo os dígitos fornecidos)
            const { data: parents, error: fetchError } = await supabase
                .from('people')
                .select('id, cpf, phone, full_name')
                .or(`cpf.eq.${cleanSearch},phone.ilike.%${cleanSearch}%`);

            if (fetchError) throw fetchError;

            // Refinamento no front-end caso a busca ilike retorne mais de um
            const parent = parents?.find(p => {
                const dbCpf = p.cpf?.replace(/\D/g, '');
                const dbPhone = p.phone?.replace(/\D/g, '');

                return dbCpf === cleanSearch ||
                    (dbPhone && dbPhone.includes(cleanSearch)) ||
                    (dbPhone && cleanSearch.length >= 8 && dbPhone.endsWith(cleanSearch.slice(-8)));
            });

            if (!parent) {
                toast({
                    title: "Não encontrado",
                    description: "Verifique o número/CPF ou procure a recepção do Kids.",
                    variant: "destructive"
                });
                return;
            }

            console.log(`Pai encontrado: ${parent.full_name} (${parent.id})`);
            setCurrentParentId(parent.id);
            fetchActiveRecords(parent.id);
            setIsLogged(true);
        } catch (error) {
            console.error('Portal login error:', error);
            toast({
                title: "Erro ao acessar",
                description: "Ocorreu um problema na comunicação com o servidor.",
                variant: "destructive"
            });
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
        if (!isLogged || !currentParentId) return;

        // Subscribe to changes for real-time alerts
        const channel = supabase
            .channel('parent-alerts')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'kids_checkins',
                    filter: `responsible_id=eq.${currentParentId}`
                },
                () => {
                    console.log('Real-time update: refetching checkins');
                    fetchActiveRecords(currentParentId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isLogged, currentParentId, familyCheckins.length]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex flex-col items-center">

            {!isLogged ? (
                <div className="w-full max-w-md mt-20 animate-in fade-in slide-in-from-bottom-8">
                    <div className="text-center mb-10">
                        <div className="bg-primary/10 w-24 h-24 rounded-sm flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="h-12 w-12 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">Acompanhamento Kids</h1>
                        <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Acompanhe seus filhos em tempo real</p>
                    </div>

                    <div className="rounded-sm border shadow-sm p-6 bg-card">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block text-center">WhatsApp</label>
                                <Input
                                    placeholder="Seu WhatsApp"
                                    className="h-16 text-xl rounded-sm border focus-visible:ring-1 focus-visible:ring-primary/20 text-center"
                                    value={phone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length === 10 || val.length === 11) {
                                            // Mask as Phone/WhatsApp
                                            if (val.length === 10) setPhone(`(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`);
                                            else setPhone(`(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`);
                                        } else {
                                            setPhone(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                className="w-full h-16 text-lg font-bold uppercase tracking-widest rounded-sm"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? "BUSCANDO..." : "ACESSAR MEU PAINEL"}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-2xl space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold tracking-tight">Status da Família</h2>
                        <Button
                            variant="ghost"
                            className="rounded-sm font-bold group text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                setIsLogged(false);
                                setCurrentParentId(null);
                                setFamilyCheckins([]);
                                setPhone('');
                            }}
                        >
                            <LogOut className="h-4 w-4 mr-2 group-active:translate-x-1 transition-transform" /> Sair
                        </Button>
                    </div>

                    {/* Photo Slideshow Component */}
                    <PhotoSlideshow records={familyCheckins} />

                    {familyCheckins.length > 0 ? (
                        familyCheckins.map(record => (
                            <div key={record.id} className="overflow-hidden border shadow-sm rounded-sm bg-card">
                                <div className="p-0">
                                    <div className={`p-6 flex items-center justify-between border-b ${record.status === 'alert' ? 'bg-destructive/10' :
                                        record.status === 'completed' ? 'bg-muted/30' :
                                            'bg-card'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-4 rounded-sm ${record.status === 'alert' ? 'bg-destructive text-destructive-foreground animate-pulse' :
                                                record.status === 'completed' ? 'bg-muted-foreground/10 text-muted-foreground' :
                                                    'bg-primary/10 text-primary'
                                                }`}>
                                                <Baby className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{record.children.full_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                        Entrada: {format(new Date(record.checkin_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {record.status === 'active' && (
                                                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-3 py-1 text-[10px] uppercase tracking-widest shadow-none">EM SALA</Badge>
                                            )}
                                            {record.status === 'alert' && (
                                                <Badge className="bg-destructive text-destructive-foreground border-none font-bold px-3 py-1 text-[10px] uppercase tracking-widest flex gap-1 items-center shadow-none">
                                                    <Bell size={12} fill="currentColor" /> ALERTA
                                                </Badge>
                                            )}
                                            {record.status === 'completed' && (
                                                <Badge variant="outline" className="font-bold px-3 py-1 text-[10px] uppercase tracking-widest shadow-none">FINALIZADO</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {record.status !== 'completed' && (
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                                            <div className="flex-1 text-center md:text-left">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">CÓDIGO DE SEGURANÇA</p>
                                                <p className="text-4xl md:text-5xl font-black tracking-[0.2em] text-foreground">{record.security_code}</p>
                                            </div>

                                            {record.status === 'alert' && (
                                                <div className="bg-destructive/10 p-5 rounded-sm flex items-center gap-4 w-full md:w-auto border border-destructive/20 animate-in zoom-in">
                                                    <ShieldAlert className="h-8 w-8 text-destructive" />
                                                    <div className="text-left">
                                                        <p className="text-destructive font-bold text-sm uppercase tracking-widest">Chamada Urgente</p>
                                                        <p className="text-destructive/80 text-xs font-medium">Por favor, dirija-se ao Kids.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {record.status === 'active' && (
                                                <div className="bg-primary/5 p-4 rounded-sm flex items-center gap-3 w-full md:w-auto border border-primary/10">
                                                    <CheckCircle2 className="text-primary h-5 w-5" />
                                                    <span className="text-primary font-bold text-xs">Criança segura participando das atividades.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-30 border-2 border-dashed rounded-sm">
                            <Baby size={48} className="mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Nenhum check-in recente</p>
                        </div>
                    )}

                    <div className="mt-8 bg-card text-card-foreground border p-8 rounded-sm shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/10 p-4 rounded-sm">
                                <Navigation className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Dúvidas ou Suporte?</h3>
                                <p className="text-xs text-muted-foreground font-bold">Nossa equipe está à disposição na entrada do prédio.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
