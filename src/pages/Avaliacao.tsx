import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, Heart, MessageSquare, Sparkles, ChevronRight, ChevronLeft, Send, CheckCircle2, User, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AvaliacaoProps {
    isPublic?: boolean;
}

const STEPS = [
    { id: 'profile', title: 'Perfil', icon: User },
    { id: 'experience', title: 'Experiência', icon: Sparkles },
    { id: 'connection', title: 'Conexão', icon: Heart },
    { id: 'feedback', title: 'Feedback', icon: MessageSquare }
];

const Avaliacao: React.FC<AvaliacaoProps> = ({ isPublic = false }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        is_first_time: null as boolean | null,
        how_met: '',
        rating_reception: 0,
        rating_environment: 0,
        use_kids: null as boolean | null,
        rating_kids: 0,
        rating_worship: 0,
        rating_arts: 0,
        rating_word: 0,
        service_flow: '',
        well_assisted: '',
        assisted_comment: '',
        experience_description: '',
        nps_score: 5,
        suggestions: '',
        testimony_prayer: ''
    });

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('experience_surveys')
                .insert([formData]);

            if (error) throw error;

            setSubmitted(true);
            toast.success('Muito obrigado por sua avaliação!');
        } catch (error: any) {
            console.error('Erro ao enviar avaliação:', error);
            toast.error('Não foi possível enviar a avaliação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
        <div className="space-y-2 py-2">
            <Label className="text-base font-medium">{label}</Label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={cn(
                            "transition-all duration-200 transform hover:scale-110",
                            star <= value ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground opacity-30"
                        )}
                    >
                        <Star size={32} />
                    </button>
                ))}
            </div>
        </div>
    );

    const renderWelcome = () => (
        <div className="text-center space-y-6 pt-4 animate-fade-in">
            <div className="flex justify-center">
                <div className="bg-primary/10 p-4 rounded-full">
                    <Smile className="h-16 w-16 text-primary" />
                </div>
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sua voz importa muito!</h1>
                <p className="text-muted-foreground text-lg">
                    Queremos que sua experiência em nosso culto seja extraordinária.
                    Leva apenas 2 minutinhos.
                </p>
            </div>
            <Button
                size="lg"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-12 text-lg h-14 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
                Começar <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center space-y-6 py-12 animate-fade-in">
            <div className="flex justify-center">
                <div className="bg-emerald-100 dark:bg-emerald-950 p-4 rounded-full">
                    <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Obrigado!</h2>
                <p className="text-muted-foreground text-lg">
                    Seus comentários nos ajudam a servir melhor a cada semana.
                    Que Deus te abençoe grandemente!
                </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="rounded-full">
                Enviar Outra Resposta
            </Button>
        </div>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 0: // Step indices 0-3 based on STEPS array
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold">É a sua primeira vez conosco?</Label>
                            <RadioGroup
                                onValueChange={(v) => setFormData({ ...formData, is_first_time: v === 'sim' })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2 border rounded-xl p-4 flex-1 cursor-pointer hover:bg-accent/50">
                                    <RadioGroupItem value="sim" id="sim" />
                                    <Label htmlFor="sim" className="flex-1 cursor-pointer">Sim</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-xl p-4 flex-1 cursor-pointer hover:bg-accent/50">
                                    <RadioGroupItem value="nao" id="nao" />
                                    <Label htmlFor="nao" className="flex-1 cursor-pointer">Não</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-lg font-semibold" htmlFor="how_met">Como você nos conheceu?</Label>
                            <Input
                                id="how_met"
                                placeholder="Ex: Redes sociais, convite de amigo..."
                                value={formData.how_met}
                                onChange={(e) => setFormData({ ...formData, how_met: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <StarRating
                            label="Recepção e Boas-vindas"
                            value={formData.rating_reception}
                            onChange={(v) => setFormData({ ...formData, rating_reception: v })}
                        />
                        <StarRating
                            label="Ambiente e Estrutura"
                            value={formData.rating_environment}
                            onChange={(v) => setFormData({ ...formData, rating_environment: v })}
                        />

                        <div className="space-y-4 pt-4 border-t">
                            <Label className="text-base font-semibold">Você utilizou o Ministério Infantil (Kids)?</Label>
                            <RadioGroup
                                onValueChange={(v) => setFormData({ ...formData, use_kids: v === 'sim' })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="sim" id="kids-sim" />
                                    <Label htmlFor="kids-sim" className="flex-1">Sim</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="nao" id="kids-nao" />
                                    <Label htmlFor="kids-nao" className="flex-1">Não</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {formData.use_kids && (
                            <div className="animate-in slide-in-from-top-4 duration-300">
                                <StarRating
                                    label="Avaliação Ministério Infantil"
                                    value={formData.rating_kids}
                                    onChange={(v) => setFormData({ ...formData, rating_kids: v })}
                                />
                            </div>
                        )}

                        <StarRating
                            label="Louvor e Adoração"
                            value={formData.rating_worship}
                            onChange={(v) => setFormData({ ...formData, rating_worship: v })}
                        />
                        <StarRating
                            label="Ministério de Dança/Artes"
                            value={formData.rating_arts}
                            onChange={(v) => setFormData({ ...formData, rating_arts: v })}
                        />
                        <StarRating
                            label="A Palavra (Pregação)"
                            value={formData.rating_word}
                            onChange={(v) => setFormData({ ...formData, rating_word: v })}
                        />

                        <div className="space-y-4 pt-4 border-t">
                            <Label className="text-base font-semibold">O que achou do tempo de duração do culto?</Label>
                            <RadioGroup
                                onValueChange={(v) => setFormData({ ...formData, service_flow: v })}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                            >
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="adequate" id="flow-ok" />
                                    <Label htmlFor="flow-ok" className="flex-1 text-xs">Adequado</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="too_long" id="flow-long" />
                                    <Label htmlFor="flow-long" className="flex-1 text-xs">Longo demais</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="too_fast" id="flow-short" />
                                    <Label htmlFor="flow-short" className="flex-1 text-xs">Muito rápido</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold">Você foi bem auxiliado pelos nossos voluntários?</Label>
                            <RadioGroup
                                onValueChange={(v) => setFormData({ ...formData, well_assisted: v })}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                            >
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="sim" id="ast-sim" />
                                    <Label htmlFor="ast-sim" className="flex-1">Sim</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="nao" id="ast-nao" />
                                    <Label htmlFor="ast-nao" className="flex-1">Não</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                    <RadioGroupItem value="nao_precisei" id="ast-np" />
                                    <Label htmlFor="ast-np" className="flex-1">Não precisei</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-lg font-semibold" htmlFor="ast_comm">O que mais te chamou a atenção na forma como foi servido?</Label>
                            <Textarea
                                id="ast_comm"
                                placeholder="Conte um pouco..."
                                value={formData.assisted_comment}
                                onChange={(e) => setFormData({ ...formData, assisted_comment: e.target.value })}
                                className="min-h-[100px] rounded-xl"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-lg font-semibold" htmlFor="exp_desc">Em uma frase, como descreveria sua experiência hoje?</Label>
                            <Input
                                id="exp_desc"
                                placeholder="Ex: Me senti em casa!"
                                value={formData.experience_description}
                                onChange={(e) => setFormData({ ...formData, experience_description: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Label className="text-lg font-semibold">Qual a probabilidade de você voltar ou convidar um amigo?</Label>
                                <span className="text-2xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                                    {formData.nps_score}
                                </span>
                            </div>
                            <div className="px-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={formData.nps_score}
                                    onChange={(e) => setFormData({ ...formData, nps_score: parseInt(e.target.value) })}
                                    className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                                    <span>Pouco provável</span>
                                    <span>Muito provável</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-lg font-semibold" htmlFor="sugg">Algo que podemos melhorar para o próximo culto?</Label>
                            <Textarea
                                id="sugg"
                                placeholder="Sua sugestão é muito bem-vinda..."
                                value={formData.suggestions}
                                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                                className="min-h-[100px] rounded-xl"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-lg font-semibold" htmlFor="testm">Gostaria de deixar um testemunho ou pedido de oração?</Label>
                            <Textarea
                                id="testm"
                                placeholder="Estamos aqui para interceder por você..."
                                value={formData.testimony_prayer}
                                onChange={(e) => setFormData({ ...formData, testimony_prayer: e.target.value })}
                                className="min-h-[100px] rounded-xl"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const content = (
        <div className={cn("max-w-2xl mx-auto py-12 px-4 sm:px-0", isPublic ? "min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20" : "")}>
            {submitted ? (
                <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl animate-scale-in">
                    <CardContent className="pt-8">
                        {renderSuccess()}
                    </CardContent>
                </Card>
            ) : (
                <div className="w-full space-y-8 animate-fade-in">
                    {!isPublic ? (
                        <div className="flex items-center justify-center gap-6 mb-4 overflow-x-auto pb-4 scrollbar-none">
                            {STEPS.map((step, idx) => (
                                <div
                                    key={step.id}
                                    className={cn(
                                        "flex flex-col items-center gap-2 transition-all duration-300",
                                        idx <= currentStep ? "text-primary translate-y-0" : "text-muted-foreground opacity-40 translate-y-1"
                                    )}
                                >
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                                        idx < currentStep ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 rotate-[360deg]" :
                                            idx === currentStep ? "border-primary bg-primary/5 font-bold shadow-[0_0_20px_rgba(var(--primary),0.2)]" : "border-muted"
                                    )}>
                                        {idx < currentStep ? <CheckCircle2 size={24} /> : <step.icon size={24} />}
                                    </div>
                                    <span className="text-[10px] whitespace-nowrap uppercase font-bold tracking-widest">{step.title}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 animate-bounce">
                                <Heart size={14} className="fill-primary" /> Pesquisa de Culto
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Sua Opinião é Ouro</h1>
                            <p className="text-muted-foreground">Ajude-nos a criar o melhor ambiente para você.</p>
                        </div>
                    )}

                    <div className="relative">
                        <Progress value={progress} className="h-1.5 rounded-full bg-secondary" />
                        <div className="absolute -top-1 left-0 w-full h-1.5 flex justify-between pointer-events-none px-1">
                            {STEPS.map((_, i) => (
                                <div key={i} className={cn("w-1 h-3 rounded-full transition-colors duration-500", i <= currentStep ? "bg-primary" : "bg-muted")} />
                            ))}
                        </div>
                    </div>

                    <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden rounded-[2rem] border border-white/10">
                        <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/5 pb-8 pt-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                                        <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                                            {React.createElement(STEPS[currentStep].icon, { size: 20 })}
                                        </div>
                                        {STEPS[currentStep].title}
                                    </CardTitle>
                                    <CardDescription className="mt-2 font-medium opacity-70">Passo {currentStep + 1} de {STEPS.length}</CardDescription>
                                </div>
                                {isPublic && (
                                    <img src="/logo.png" alt="" className="h-12 w-auto opacity-20 grayscale brightness-200" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-10 pb-8 px-8">
                            {renderStep()}
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t border-primary/5 bg-primary/5 p-8">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={currentStep === 0 || loading}
                                className="rounded-2xl h-12 px-6 font-bold hover:bg-background/80"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                            </Button>
                            <div className="flex items-center gap-4">
                                {currentStep === STEPS.length - 1 ? (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="rounded-2xl h-12 px-10 shadow-xl shadow-primary/30 font-bold bg-primary hover:scale-105 transition-transform"
                                    >
                                        {loading ? 'Enviando...' : 'Enviar Agora'} <Send className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNext}
                                        className="rounded-2xl h-12 px-10 font-bold hover:scale-105 transition-transform"
                                    >
                                        Próximo <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>

                    <div className="flex flex-col items-center gap-4 py-4">
                        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                            Ministério Cristo Vive <div className="h-1 w-1 rounded-full bg-primary/40" /> Excellence Service
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    if (isPublic) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
                {content}
            </div>
        );
    }

    return (
        <DashboardLayout title="Avaliação de Culto">
            {content}
        </DashboardLayout>
    );
};

export default Avaliacao;
