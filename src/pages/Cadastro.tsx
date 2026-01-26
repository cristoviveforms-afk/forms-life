import { useState } from 'react';
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

  const [batizadoAguas, setBatizadoAguas] = useState(false);
  const [dataBatismo, setDataBatismo] = useState('');
  const [batizadoEspirito, setBatizadoEspirito] = useState(false);
  const [participaMinisterio, setParticipaMinisterio] = useState(false);
  const [ministeriosSelecionados, setMinisteriosSelecionados] = useState<string[]>([]);
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

  const addFilho = () => {
    setFilhos([...filhos, { nome: '', idade: '' }]);
  };

  const removeFilho = (index: number) => {
    setFilhos(filhos.filter((_, i) => i !== index));
  };

  const toggleMinisterio = (ministerio: string) => {
    setMinisteriosSelecionados(prev =>
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
      const { data, error } = await supabase
        .from('people' as any)
        .select(`
          *,
          children (*)
        `)
        .eq('phone', searchPhone)
        .eq('type', 'visitante') // Only search for visitors? Or anyone? Assumption: Returning Visitors.
        .single();

      if (error || !data) {
        toast({
          title: 'Não encontrado',
          description: 'Nenhum cadastro de visitante encontrado com este telefone.',
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
      setMinisteriosSelecionados(data.ministries || []);
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

      const payload = {
        type: tipoPessoa,
        full_name: nome,
        birth_date: nascimento || null,
        gender: sexo || null,
        civil_status: estadoCivil || null,
        spouse_name: estadoCivil === 'casado' ? conjuge : null,

        phone: telefone,
        email: email || null,
        address: endereco || null,
        how_met: comoConheceu || null,

        baptized_water: batizadoAguas,
        baptism_date: dataBatismo || null,
        baptized_spirit: batizadoEspirito,
        has_ministry: participaMinisterio,
        ministries: participaMinisterio ? ministeriosSelecionados : [],
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

      // 2. Manage Children
      if (person) {
        // If updating, delete invalid or all existing children first to replace? 
        // Simple approach: Delete all and re-insert for simplicity in this form
        if (personId) {
          await supabase.from('children' as any).delete().eq('parent_id', personId);
        }

        if (possuiFilhos && filhos.length > 0) {
          const childrenToInsert = filhos
            .filter(f => f.nome.trim() !== '')
            .map(f => ({
              parent_id: (person as any).id,
              name: f.nome,
              age: f.idade ? f.idade : null
            }));

          if (childrenToInsert.length > 0) {
            const { error: childrenError } = await supabase
              .from('children' as any)
              .insert(childrenToInsert as any);

            if (childrenError) throw childrenError;
          }
        }

        toast({
          title: personId ? 'Cadastro atualizado!' : 'Cadastro realizado!',
          description: 'Os dados foram salvos com sucesso.',
        });
        navigate(-1);
      }
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
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <form onSubmit={handleSubmit}>
          {/* Tipo de Pessoa */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tipo de Cadastro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {(['membro', 'visitante'] as PersonType[]).map((tipo) => (
                  <Button
                    key={tipo}
                    type="button"
                    variant={tipoPessoa === tipo ? 'default' : 'outline'}
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
                <div className="flex justify-center gap-6">
                  <Button
                    type="button"
                    size="lg"
                    className="w-40"
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
                    className="w-40"
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
                    placeholder="Digite o Telefone ou WhatsApp"
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

              {/* Contato */}
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
                            if (!c) setMinisteriosSelecionados([]);
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
                                checked={ministeriosSelecionados.includes(ministerio)}
                                onCheckedChange={() => toggleMinisterio(ministerio)}
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
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
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
