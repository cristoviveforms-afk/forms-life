import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { PersonType } from '@/types/database';

interface Filho {
  nome: string;
  idade: string;
}

const MINISTERIOS_LIST = [
  'Cordão de 3 Dobras',
  'Coc Teens',
  'Coc Jovens',
  'Voluntário',
  'Dança',
  'Louvor',
  'Diácono',
  'Pastor',
  'Mestre CFB',
  'Missão',
];

const FOLLOWUP_MINISTRIES = [
  'Ministério de Casais',
  'Ministério de Homens',
  'Ministério de Mulheres',
  'Ministério de Jovens',
  'Ministério de Teens',
  'Ministério Infantil (Kids)',
];

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tipoParam = searchParams.get('tipo') as PersonType | null;

  const [loading, setLoading] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<PersonType>(tipoParam || 'membro');
  const [visitorQuestionAnswered, setVisitorQuestionAnswered] = useState(false);

  // Search / Update Logic
  const [personId, setPersonId] = useState<string | null>(null);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');

  // Fetch data if personId is provided in URL
  useEffect(() => {
    const editPersonId = searchParams.get('personId');
    if (editPersonId) {
      loadPersonData(editPersonId);
    }
  }, [searchParams]);

  const loadPersonData = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('people' as any)
        .select(`
          *,
          children (*)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        toast({
          title: 'Erro ao carregar',
          description: 'Cadastro não encontrado.',
          variant: 'destructive',
        });
        navigate('/dashboard'); // Redirect back on error
        return;
      }

      // Populate fields
      setPersonId(data.id);

      // Determine type if not set correctly or override
      if (data.type) {
        setTipoPessoa(data.type as PersonType);
      }

      setNome(data.full_name || '');
      setNascimento(data.birth_date || '');
      setSexo(data.gender || '');
      setEstadoCivil(data.civil_status || '');
      setConjuge(data.spouse_name || '');
      setTelefone(data.phone || '');
      setEmail(data.email || '');
      setEndereco(data.address || '');
      setComoConheceu(data.how_met || '');

      // Check conversion today based on date? or just trust flag if we had one?
      // For now, we don't have a specific "accepted_jesus" flag in DB different from conversion_date logic
      // But we can check if conversion_date is Today
      if (data.conversion_date === new Date().toISOString().split('T')[0]) {
        setAcceptedJesus(true);
      } else {
        setAcceptedJesus(false);
      }

      setBatizadoAguas(data.baptized_water);
      setDataBatismo(data.baptism_date || '');
      setBatizadoEspirito(data.baptized_spirit);
      setParticipaMinisterio(data.has_ministry);

      const allMinistries = data.ministries || [];
      setMinisteriosServindo(allMinistries.filter((m: string) => MINISTERIOS_LIST.includes(m)));
      setMinisteriosAcompanhamento(allMinistries.filter((m: string) => FOLLOWUP_MINISTRIES.includes(m)));
      setDonsNaturais(data.natural_skills || '');
      setDonsEspirituais(data.spiritual_gifts || '');

      setVisitantePrimeiraVez(data.visitor_first_time);
      setVisitanteQuerContato(data.visitor_wants_contact);
      setVisitanteQuerDiscipulado(data.visitor_wants_discipleship);
      setOutraReligiao(data.visitor_religion || '');
      setPedidoOracao(data.visitor_prayer_request || '');

      if (data.type === 'convertido') {
        setDataConversao(data.conversion_date || '');
        setConvertidoQuerAcompanhamento(data.convert_wants_accompaniment);
        setNecessidades(data.convert_needs || '');
      }

      if (data.type === 'membro') {
        setDataIntegracao(data.integration_date || '');
        setJaServiu(data.member_has_served);
        setMinisterioAnterior(data.member_prev_ministry || '');
      }

      setQuemConvidou(data.invited_by || '');

      // Children
      if (data.children && data.children.length > 0) {
        setPossuiFilhos(true);
        setFilhos(data.children.map((c: any) => ({ nome: c.name, idade: c.age || '' })));
      } else {
        setPossuiFilhos(false);
        setFilhos([]);
      }

      // Hide initial questions and show form
      setVisitorQuestionAnswered(true);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao carregar o cadastro.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [possuiFilhos, setPossuiFilhos] = useState(false);
  const [filhos, setFilhos] = useState<Filho[]>([]);

  // State for form fields
  const [nome, setNome] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [conjuge, setConjuge] = useState('');

  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [comoConheceu, setComoConheceu] = useState('');
  const [acceptedJesus, setAcceptedJesus] = useState(false);

  const [batizadoAguas, setBatizadoAguas] = useState(false);
  const [dataBatismo, setDataBatismo] = useState('');
  // Removed duplicate lines
  const [batizadoEspirito, setBatizadoEspirito] = useState(false);
  const [participaMinisterio, setParticipaMinisterio] = useState(false);
  const [ministeriosServindo, setMinisteriosServindo] = useState<string[]>([]);
  const [ministeriosAcompanhamento, setMinisteriosAcompanhamento] = useState<string[]>([]);
  const [donsNaturais, setDonsNaturais] = useState('');
  const [donsEspirituais, setDonsEspirituais] = useState('');

  // Specific fields
  const [visitantePrimeiraVez, setVisitantePrimeiraVez] = useState(false);
  const [visitanteQuerContato, setVisitanteQuerContato] = useState(false);

  const [visitanteQuerDiscipulado, setVisitanteQuerDiscipulado] = useState(false);
  const [outraReligiao, setOutraReligiao] = useState('');
  const [pedidoOracao, setPedidoOracao] = useState('');

  const [dataConversao, setDataConversao] = useState('');
  const [convertidoQuerAcompanhamento, setConvertidoQuerAcompanhamento] = useState(false);
  const [necessidades, setNecessidades] = useState('');

  const [dataIntegracao, setDataIntegracao] = useState('');
  const [jaServiu, setJaServiu] = useState(false);
  const [ministerioAnterior, setMinisterioAnterior] = useState('');
  const [quemConvidou, setQuemConvidou] = useState('');

  const addFilho = () => {
    setFilhos([...filhos, { nome: '', idade: '' }]);
  };

  const removeFilho = (index: number) => {
    setFilhos(filhos.filter((_, i) => i !== index));
  };

  // Auto-suggest ministries (Effect)
  useEffect(() => {
    setMinisteriosAcompanhamento(prev => {
      const next = new Set(prev);
      if (estadoCivil === 'casado') next.add('Ministério de Casais');
      if (sexo === 'masculino') next.add('Ministério de Homens');
      if (sexo === 'feminino') next.add('Ministério de Mulheres');
      return Array.from(next);
    });
  }, [estadoCivil, sexo, possuiFilhos]);

  const toggleMinisterioServindo = (ministerio: string) => {
    setMinisteriosServindo(prev =>
      prev.includes(ministerio)
        ? prev.filter(m => m !== ministerio)
        : [...prev, ministerio]
    );
  };

  const toggleMinisterioAcompanhamento = (ministerio: string) => {
    setMinisteriosAcompanhamento(prev =>
      prev.includes(ministerio)
        ? prev.filter(m => m !== ministerio)
        : [...prev, ministerio]
    );
  };

  const handleSearch = async () => {
    if (!searchPhone) {
      toast({
        title: 'Telefone obrigatório',
        description: 'Por favor, informe o telefone para buscar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('people' as any)
        .select(`
          *,
          children (*)
        `)
        .eq('type', 'visitante'); // Only search for visitors

      // Check if searching by last 4 digits or full number
      const cleanPhone = searchPhone.replace(/\D/g, ''); // Remove non-digits
      if (cleanPhone.length <= 4) {
        // Search by suffix
        query = query.ilike('phone', `%${cleanPhone}`).order('created_at', { ascending: false }).limit(1);
      } else {
        // Exact match
        query = query.eq('phone', searchPhone);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        toast({
          title: 'Não encontrado',
          description: 'Nenhum cadastro de visitante encontrado com este telefone/final.',
          variant: 'destructive',
        });
        return;
      }

      // Populate fields
      setPersonId(data.id);
      setNome(data.full_name || '');
      setNascimento(data.birth_date || '');
      setSexo(data.gender || '');
      setEstadoCivil(data.civil_status || '');
      setConjuge(data.spouse_name || '');
      setTelefone(data.phone || '');
      setEmail(data.email || '');
      setEndereco(data.address || '');
      setComoConheceu(data.how_met || '');

      setBatizadoAguas(data.baptized_water);
      setDataBatismo(data.baptism_date || '');
      setBatizadoEspirito(data.baptized_spirit);
      setParticipaMinisterio(data.has_ministry);

      const allMinistries = data.ministries || [];
      setMinisteriosServindo(allMinistries.filter((m: string) => MINISTERIOS_LIST.includes(m)));
      setMinisteriosAcompanhamento(allMinistries.filter((m: string) => FOLLOWUP_MINISTRIES.includes(m)));
      setDonsNaturais(data.natural_skills || '');
      setDonsEspirituais(data.spiritual_gifts || '');

      // Visitor specific
      setVisitantePrimeiraVez(false); // They are returning
      setVisitanteQuerContato(data.visitor_wants_contact);
      setVisitanteQuerDiscipulado(data.visitor_wants_discipleship);
      setOutraReligiao(data.visitor_religion || '');
      setPedidoOracao(data.visitor_prayer_request || '');

      // Children
      if (data.children && data.children.length > 0) {
        setPossuiFilhos(true);
        setFilhos(data.children.map((c: any) => ({ nome: c.name, idade: c.age || '' })));
      } else {
        setPossuiFilhos(false);
        setFilhos([]);
      }

      // Reveal form
      setVisitorQuestionAnswered(true);
      toast({
        title: 'Cadastro Encontrado!',
        description: 'Os dados foram carregados. Você pode atualizá-los agora.',
      });

    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao buscar o cadastro.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insert or Update Person
      let personResponse;

      let familyId = (personResponse as any)?.data?.family_id;

      if (!personId && !familyId) {
        // If new person, generate a family ID
        familyId = crypto.randomUUID();
      }

      const payload: any = {
        type: tipoPessoa,
        full_name: nome,
        birth_date: nascimento || null,
        gender: sexo || null,
        civil_status: estadoCivil || null,
        spouse_name: estadoCivil === 'casado' ? conjuge : null,
        family_id: familyId,

        phone: telefone,
        email: email || null,
        address: endereco || null,
        how_met: comoConheceu || null,

        baptized_water: batizadoAguas,
        baptism_date: dataBatismo || null,
        baptized_spirit: batizadoEspirito,
        has_ministry: participaMinisterio,
        ministries: [...ministeriosServindo, ...ministeriosAcompanhamento],
        natural_skills: donsNaturais || null,
        spiritual_gifts: donsEspirituais || null,

        visitor_first_time: tipoPessoa === 'visitante' ? visitantePrimeiraVez : false,
        visitor_wants_contact: tipoPessoa === 'visitante' ? visitanteQuerContato : false,
        visitor_wants_discipleship: tipoPessoa === 'visitante' ? visitanteQuerDiscipulado : false,
        visitor_religion: tipoPessoa === 'visitante' ? outraReligiao : null,
        visitor_prayer_request: tipoPessoa === 'visitante' ? pedidoOracao : null,

        conversion_date: tipoPessoa === 'convertido' ? dataConversao || null : null,
        convert_wants_accompaniment: tipoPessoa === 'convertido' ? convertidoQuerAcompanhamento : false,
        convert_needs: tipoPessoa === 'convertido' ? necessidades : null,

        integration_date: tipoPessoa === 'membro' ? dataIntegracao || null : null,
        member_has_served: tipoPessoa === 'membro' ? jaServiu : false,
        member_prev_ministry: tipoPessoa === 'membro' && jaServiu ? ministerioAnterior : null,

        invited_by: quemConvidou || null,

        // Always update visit date when saving/updating a visitor
        last_visit_date: new Date().toISOString(),
      };

      if (personId) {
        // Update
        personResponse = await supabase
          .from('people' as any)
          .update(payload)
          .eq('id', personId)
          .select()
          .single();
      } else {
        // Insert
        personResponse = await supabase
          .from('people' as any)
          .insert(payload)
          .select()
          .single();
      }

      const { data: person, error: personError } = personResponse;

      if (personError) throw personError;

      // 2. Manage Family Members (Spouse & Children)
      if (person && !personId) { // Only on creation to avoid duplicates/confusion on edit for now

        // Spouse
        if (estadoCivil === 'casado' && conjuge) {
          const spousePayload = {
            ...payload,
            full_name: conjuge,
            gender: sexo === 'masculino' ? 'feminino' : 'masculino', // Infer opposite gender
            spouse_name: nome, // Link back
            civil_status: 'casado',
            // Remove main person specifics if needed, but keeping address/phone is good
            ministries: [], // Reset ministries for spouse unless we ask?
            visitor_first_time: false, // Maybe true? Assume same as main
          };

          // Auto-assign ministry
          // If inferred gender is male, assign Men's Ministry, etc.
          const spouseMinistries = [];
          if (spousePayload.gender === 'masculino') spouseMinistries.push('Ministério de Homens');
          if (spousePayload.gender === 'feminino') spouseMinistries.push('Ministério de Mulheres');
          spouseMinistries.push('Ministério de Casais');

          spousePayload.ministries = spouseMinistries;

          await supabase.from('people' as any).insert(spousePayload);
        }

        // Children - Create separate Profiles
        if (possuiFilhos && filhos.length > 0) {
          for (const filho of filhos) {
            if (!filho.nome.trim()) continue;

            // Calculate birth date from age approx
            let birthDate = null;
            if (filho.idade) {
              const year = new Date().getFullYear() - parseInt(filho.idade);
              birthDate = `${year}-01-01`;
            }

            const childPayload = {
              ...payload,
              full_name: filho.nome,
              birth_date: birthDate,
              gender: null, // We don't ask child gender
              civil_status: 'solteiro',
              spouse_name: null,
              ministries: ['Ministério Infantil (Kids)'],
              type: 'visitante', // Or 'crianca' if we had it
              family_id: familyId
            };

            await supabase.from('people' as any).insert(childPayload);
          }
        }
      }

      // Fallback: Still insert into children table for old compatibility?
      // No, user requested "create cadastro do secundarios". We are doing that above.
      // We can skip inserting into 'children' table if we are using 'people' table for them.
      // But for safety/backward compat, let's keep the old table populated too IF needed.
      // For now, I will Comment out the old table insertion to avoid confusion, 
      // or keep it if 'children' table is used for something else.
      // Implementation Plan said: "We will STOP using the separate children table".

      /* 
      if (person) {
        if (personId) {
          await supabase.from('children' as any).delete().eq('parent_id', personId);
        }
        ...
      } 
      */

      toast({
        title: personId ? 'Cadastro atualizado!' : 'Cadastro realizado!',
        description: 'Os dados foram salvos com sucesso.',
      });
      // Navigate explicitly to avoid history issues on mobile
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao tentar salvar o cadastro.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Novo Cadastro">
      <div className="max-w-3xl mx-auto animate-fade-in">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Dashboard
        </Button>

        <form onSubmit={handleSubmit}>
          {/* Tipo de Pessoa */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tipo de Cadastro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start">
                {(['membro', 'visitante'] as PersonType[]).map((tipo) => (
                  <Button
                    key={tipo}
                    type="button"
                    variant={tipoPessoa === tipo ? 'default' : 'outline'}
                    className="flex-1 md:flex-none min-w-[120px]"
                    onClick={() => {
                      setTipoPessoa(tipo);
                      setVisitorQuestionAnswered(false);
                      setPersonId(null);
                      setIsReturningVisitor(false);
                      setSearchPhone('');
                    }}
                  >
                    {tipo === 'membro' && 'Membro'}
                    {tipo === 'visitante' && 'Visitante'}
                    {tipo === 'convertido' && 'Novo Convertido'}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pergunta Inicial para Visitante */}
          {tipoPessoa === 'visitante' && !visitorQuestionAnswered && (
            <Card className="mb-6 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle className="text-center text-xl">É sua primeira vez ou está retornando?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full md:w-40"
                    onClick={() => {
                      setVisitantePrimeiraVez(true);
                      setVisitorQuestionAnswered(true);
                    }}
                  >
                    1ª Vez
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full md:w-40"
                    onClick={() => {
                      setIsReturningVisitor(true);
                      // Don't set visitorQuestionAnswered yet, we need to search first
                    }}
                  >
                    Retornando
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Busca para Visitante Retornando */}
          {tipoPessoa === 'visitante' && isReturningVisitor && !visitorQuestionAnswered && (
            <Card className="mb-6 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Buscar Cadastro (Visitante)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o Telefone ou últimos 4 dígitos"
                    value={searchPhone}
                    onChange={e => setSearchPhone(e.target.value)}
                  />
                  <Button type="button" onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : 'Buscar'}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsReturningVisitor(false);
                    setVisitantePrimeiraVez(true);
                    setVisitorQuestionAnswered(true); // Switch to manual entry
                  }}
                >
                  Não encontrei, cadastrar como novo
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dados Pessoais e Restante do Formulário */}
          {(tipoPessoa !== 'visitante' || visitorQuestionAnswered) && (
            <>


              {/* LAYOUT PARA VISITANTES */}
              {tipoPessoa === 'visitante' ? (
                <>
                  {/* Bloco 1: Boas Vindas */}
                  <Card className="mb-6 border-l-4 border-l-primary/50">
                    <CardHeader>
                      <CardTitle>Boas Vindas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          placeholder="Nome completo"
                          required
                          value={nome}
                          onChange={e => setNome(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="telefone">WhatsApp / Telefone *</Label>
                          <Input
                            id="telefone"
                            placeholder="(00) 00000-0000"
                            required
                            value={telefone}
                            onChange={e => setTelefone(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sexo">Sexo</Label>
                          <Select value={sexo} onValueChange={setSexo}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="quem_convidou">Quem convidou</Label>
                          <Input
                            id="quem_convidou"
                            placeholder="Nome de quem o convidou"
                            value={quemConvidou}
                            onChange={e => setQuemConvidou(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bloco 2: Conexão */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Conexão</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nascimento">Data de Nascimento</Label>
                          <Input
                            id="nascimento"
                            type="date"
                            value={nascimento}
                            onChange={e => setNascimento(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estado_civil">Estado Civil</Label>
                          <Select value={estadoCivil} onValueChange={setEstadoCivil}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                              <SelectItem value="casado">Casado(a)</SelectItem>
                              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {estadoCivil === 'casado' && (
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="conjuge">Nome do Cônjuge</Label>
                            <Input
                              id="conjuge"
                              placeholder="Nome do cônjuge"
                              value={conjuge}
                              onChange={e => setConjuge(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-2 md:col-span-2 pt-2">
                          <Checkbox
                            id="accepted_jesus"
                            checked={acceptedJesus}
                            onCheckedChange={(checked) => setAcceptedJesus(!!checked)}
                          />
                          <Label htmlFor="accepted_jesus" className="font-semibold text-primary">
                            Aceitou Jesus hoje? (Novo Convertido)
                          </Label>
                        </div>
                      </div>

                      {/* Filhos (Reused Logic) */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="possui_filhos"
                            checked={possuiFilhos}
                            onCheckedChange={(checked) => {
                              setPossuiFilhos(!!checked);
                              if (!checked) setFilhos([]);
                            }}
                          />
                          <Label htmlFor="possui_filhos">Possui filhos?</Label>
                        </div>

                        {possuiFilhos && (
                          <div className="space-y-3">
                            {filhos.map((filho, index) => (
                              <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1">
                                  <Label>Nome do Filho</Label>
                                  <Input
                                    value={filho.nome}
                                    onChange={(e) => {
                                      const newFilhos = [...filhos];
                                      newFilhos[index].nome = e.target.value;
                                      setFilhos(newFilhos);
                                    }}
                                    placeholder="Nome"
                                  />
                                </div>
                                <div className="w-24 space-y-1">
                                  <Label>Idade</Label>
                                  <Input
                                    value={filho.idade}
                                    onChange={(e) => {
                                      const newFilhos = [...filhos];
                                      newFilhos[index].idade = e.target.value;
                                      setFilhos(newFilhos);
                                    }}
                                    placeholder="Idade"
                                    type="number"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFilho(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addFilho}>
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Filho
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Endereço e Outros (from Contato) */}
                      <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@exemplo.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço Completo</Label>
                        <Textarea
                          id="endereco"
                          placeholder="Rua, número, bairro, cidade - UF"
                          value={endereco}
                          onChange={e => setEndereco(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="como_conheceu">Como conheceu a igreja?</Label>
                        <Select value={comoConheceu} onValueChange={setComoConheceu}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amigos">Amigos/Família</SelectItem>
                            <SelectItem value="redes">Redes Sociais</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="passando">Passando pela região</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* LAYOUT PADRÃO (MEMBROS E OUTROS) */
                <>
                  {/* Dados Pessoais */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Dados Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="nome">Nome Completo *</Label>
                          <Input
                            id="nome"
                            placeholder="Nome completo"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nascimento">Data de Nascimento</Label>
                          <Input
                            id="nascimento"
                            type="date"
                            value={nascimento}
                            onChange={e => setNascimento(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sexo">Sexo</Label>
                          <Select value={sexo} onValueChange={setSexo}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estado_civil">Estado Civil</Label>
                          <Select value={estadoCivil} onValueChange={setEstadoCivil}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                              <SelectItem value="casado">Casado(a)</SelectItem>
                              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {estadoCivil === 'casado' && (
                          <div className="space-y-2">
                            <Label htmlFor="conjuge">Nome do Cônjuge</Label>
                            <Input
                              id="conjuge"
                              placeholder="Nome do cônjuge"
                              value={conjuge}
                              onChange={e => setConjuge(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="quem_convidou">Quem convidou</Label>
                          <Input
                            id="quem_convidou"
                            placeholder="Nome de quem o convidou"
                            value={quemConvidou}
                            onChange={e => setQuemConvidou(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Filhos */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="possui_filhos"
                            checked={possuiFilhos}
                            onCheckedChange={(checked) => {
                              setPossuiFilhos(!!checked);
                              if (!checked) setFilhos([]);
                            }}
                          />
                          <Label htmlFor="possui_filhos">Possui filhos?</Label>
                        </div>

                        {possuiFilhos && (
                          <div className="space-y-3">
                            {filhos.map((filho, index) => (
                              <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1">
                                  <Label>Nome do Filho</Label>
                                  <Input
                                    value={filho.nome}
                                    onChange={(e) => {
                                      const newFilhos = [...filhos];
                                      newFilhos[index].nome = e.target.value;
                                      setFilhos(newFilhos);
                                    }}
                                    placeholder="Nome"
                                  />
                                </div>
                                <div className="w-24 space-y-1">
                                  <Label>Idade</Label>
                                  <Input
                                    value={filho.idade}
                                    onChange={(e) => {
                                      const newFilhos = [...filhos];
                                      newFilhos[index].idade = e.target.value;
                                      setFilhos(newFilhos);
                                    }}
                                    placeholder="Idade"
                                    type="number"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFilho(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addFilho}>
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Filho
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contato (Padrão) */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                          <Input
                            id="telefone"
                            placeholder="(00) 00000-0000"
                            required
                            value={telefone}
                            onChange={e => setTelefone(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="email@exemplo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço Completo</Label>
                        <Textarea
                          id="endereco"
                          placeholder="Rua, número, bairro, cidade - UF"
                          value={endereco}
                          onChange={e => setEndereco(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="como_conheceu">Como conheceu a igreja?</Label>
                        <Select value={comoConheceu} onValueChange={setComoConheceu}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amigos">Amigos/Família</SelectItem>
                            <SelectItem value="redes">Redes Sociais</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="passando">Passando pela região</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Campos Espirituais - Apenas para Membros */}
              {tipoPessoa === 'membro' && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Informações Espirituais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="data_conversao">Data da Conversão</Label>
                        <Input
                          id="data_conversao"
                          type="date"
                          value={dataConversao}
                          onChange={e => setDataConversao(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="batizado_aguas"
                          checked={batizadoAguas}
                          onCheckedChange={(c) => setBatizadoAguas(!!c)}
                        />
                        <Label htmlFor="batizado_aguas">Batizado nas águas?</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data_batismo">Data do Batismo</Label>
                        <Input
                          id="data_batismo"
                          type="date"
                          value={dataBatismo}
                          onChange={e => setDataBatismo(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="batizado_espirito"
                          checked={batizadoEspirito}
                          onCheckedChange={c => setBatizadoEspirito(!!c)}
                        />
                        <Label htmlFor="batizado_espirito">Batizado com Espírito Santo?</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="participa_ministerio"
                          checked={participaMinisterio}
                          onCheckedChange={c => {
                            setParticipaMinisterio(!!c);
                            if (!c) setMinisteriosServindo([]);
                          }}
                        />
                        <Label htmlFor="participa_ministerio">Participa de algum Ministério?</Label>
                      </div>
                    </div>

                    {participaMinisterio && (
                      <div className="space-y-3 pt-4 border-t">
                        <Label>Selecione os Ministérios:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {MINISTERIOS_LIST.map((ministerio) => (
                            <div key={ministerio} className="flex items-center space-x-2">
                              <Checkbox
                                id={`ministerio-${ministerio}`}
                                checked={ministeriosServindo.includes(ministerio)}
                                onCheckedChange={() => toggleMinisterioServindo(ministerio)}
                              />
                              <Label htmlFor={`ministerio-${ministerio}`} className="text-sm font-normal cursor-pointer">
                                {ministerio}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="dons_naturais">Dons e Habilidades Naturais</Label>
                      <Textarea
                        id="dons_naturais"
                        placeholder="Ex: música, dança, mídia, comunicação..."
                        value={donsNaturais}
                        onChange={e => setDonsNaturais(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dons_espirituais">Dons Espirituais e Ministeriais</Label>
                      <Textarea
                        id="dons_espirituais"
                        placeholder="Ex: profecia, ensino, liderança, serviço..."
                        value={donsEspirituais}
                        onChange={e => setDonsEspirituais(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Campos específicos por tipo */}
              {tipoPessoa === 'visitante' && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Informações do Visitante</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="primeira_vez"
                        checked={visitantePrimeiraVez}
                        onCheckedChange={c => setVisitantePrimeiraVez(!!c)}
                      />
                      <Label htmlFor="primeira_vez">Primeira vez na igreja?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deseja_contato"
                        checked={visitanteQuerContato}
                        onCheckedChange={c => setVisitanteQuerContato(!!c)}
                      />
                      <Label htmlFor="deseja_contato">Deseja ser contactado?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deseja_discipulado"
                        checked={visitanteQuerDiscipulado}
                        onCheckedChange={c => setVisitanteQuerDiscipulado(!!c)}
                      />
                      <Label htmlFor="deseja_discipulado">Deseja fazer discipulado?</Label>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="outra_religiao">É de outra religião? Se sim, qual?</Label>
                      <Input
                        id="outra_religiao"
                        placeholder="Ex: Católica, Espírita, Nenhuma..."
                        value={outraReligiao}
                        onChange={e => setOutraReligiao(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pedido_oracao">Deseja alguma oração específica?</Label>
                      <Textarea
                        id="pedido_oracao"
                        placeholder="Ex: Pela família, saúde, libertação..."
                        value={pedidoOracao}
                        onChange={e => setPedidoOracao(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id="visitante_batizado_espirito"
                        checked={batizadoEspirito}
                        onCheckedChange={c => setBatizadoEspirito(!!c)}
                      />
                      <Label htmlFor="visitante_batizado_espirito">Foi batizado no Espírito Santo?</Label>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between rounded-lg border p-4 shadow-sm bg-secondary/20">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Nasceu de Novo?</Label>
                        <p className="text-sm text-muted-foreground">
                          Marque para promover este visitante a Membro agora.
                        </p>
                      </div>
                      <Checkbox
                        id="nasceu_de_novo"
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTipoPessoa('membro');
                            const today = new Date().toISOString().split('T')[0];
                            setDataIntegracao(today);
                            setDataConversao(today);
                            toast({
                              title: "Glória a Deus!",
                              description: "Visitante movido para Membros e Novos Convertidos.",
                            });
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ministries for Follow-Up (All Types) */}
              <Card className="mb-6 border-blue-200 bg-blue-50/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Ministérios para Acompanhamento
                    <span className="text-xs font-normal text-muted-foreground ml-2">(Sugeridos pelo perfil - Disponível para Liderança)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {FOLLOWUP_MINISTRIES.map((ministry) => (
                      <div key={ministry} className="flex items-center space-x-2 p-2 rounded hover:bg-white/50">
                        <Checkbox
                          id={`followup-${ministry}`}
                          checked={ministeriosAcompanhamento.includes(ministry)}
                          onCheckedChange={() => toggleMinisterioAcompanhamento(ministry)}
                        />
                        <Label htmlFor={`followup-${ministry}`} className="cursor-pointer flex-1">
                          {ministry}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {tipoPessoa === 'convertido' && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Informações do Novo Convertido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_conversao">Data da Conversão *</Label>
                      <Input
                        id="data_conversao"
                        type="date"
                        required
                        value={dataConversao}
                        onChange={e => setDataConversao(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deseja_acompanhamento"
                        checked={convertidoQuerAcompanhamento}
                        onCheckedChange={c => setConvertidoQuerAcompanhamento(!!c)}
                      />
                      <Label htmlFor="deseja_acompanhamento">Deseja acompanhamento?</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="necessidades">Necessidades Específicas</Label>
                      <Textarea
                        id="necessidades"
                        placeholder="Oração, aconselhamento, etc..."
                        value={necessidades}
                        onChange={e => setNecessidades(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {tipoPessoa === 'membro' && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Informações do Membro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_integracao">Data de Integração</Label>
                      <Input
                        id="data_integracao"
                        type="date"
                        value={dataIntegracao}
                        onChange={e => setDataIntegracao(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ja_serviu"
                        checked={jaServiu}
                        onCheckedChange={c => setJaServiu(!!c)}
                      />
                      <Label htmlFor="ja_serviu">Já serviu em algum ministério?</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ministerio_anterior">Qual ministério?</Label>
                      <Input
                        id="ministerio_anterior"
                        placeholder="Nome do ministério"
                        value={ministerioAnterior}
                        onChange={e => setMinisterioAnterior(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit */}
              <div className="flex flex-col-reverse md:flex-row gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Salvando...' : (personId ? 'Atualizar Cadastro' : 'Salvar Cadastro')}
                </Button>
              </div>
            </>
          )}
        </form>
      </div >
    </DashboardLayout >
  );
}
