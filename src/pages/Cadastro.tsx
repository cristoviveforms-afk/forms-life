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

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tipoParam = searchParams.get('tipo') as PersonType | null;

  const [loading, setLoading] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<PersonType>(tipoParam || 'membro');
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
  const [participaCelula, setParticipaCelula] = useState(false);
  const [celula, setCelula] = useState('');
  const [donsNaturais, setDonsNaturais] = useState('');
  const [donsEspirituais, setDonsEspirituais] = useState('');

  // Specific fields
  const [visitantePrimeiraVez, setVisitantePrimeiraVez] = useState(false);
  const [visitanteQuerContato, setVisitanteQuerContato] = useState(false);
  const [visitanteQuerDiscipulado, setVisitanteQuerDiscipulado] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insert Person
      const { data: person, error: personError } = await supabase
        .from('people')
        .insert({
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
          has_cell: participaCelula,
          cell_name: participaCelula ? celula : null,
          natural_skills: donsNaturais || null,
          spiritual_gifts: donsEspirituais || null,

          visitor_first_time: tipoPessoa === 'visitante' ? visitantePrimeiraVez : false,
          visitor_wants_contact: tipoPessoa === 'visitante' ? visitanteQuerContato : false,
          visitor_wants_discipleship: tipoPessoa === 'visitante' ? visitanteQuerDiscipulado : false,

          conversion_date: tipoPessoa === 'convertido' ? dataConversao || null : null,
          convert_wants_accompaniment: tipoPessoa === 'convertido' ? convertidoQuerAcompanhamento : false,
          convert_needs: tipoPessoa === 'convertido' ? necessidades : null,

          integration_date: tipoPessoa === 'membro' ? dataIntegracao || null : null,
          member_has_served: tipoPessoa === 'membro' ? jaServiu : false,
          member_prev_ministry: tipoPessoa === 'membro' && jaServiu ? ministerioAnterior : null,
        })
        .select()
        .single();

      if (personError) throw personError;

      // 2. Insert Children if any
      if (possuiFilhos && filhos.length > 0 && person) {
        const childrenToInsert = filhos
          .filter(f => f.nome.trim() !== '')
          .map(f => ({
            parent_id: person.id,
            name: f.nome,
            age: f.idade
          }));

        if (childrenToInsert.length > 0) {
          const { error: childrenError } = await supabase
            .from('children')
            .insert(childrenToInsert);

          if (childrenError) throw childrenError;
        }
      }

      toast({
        title: 'Cadastro realizado!',
        description: 'Os dados foram salvos com sucesso.',
      });
      navigate(-1);
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
                {(['membro', 'visitante', 'convertido'] as PersonType[]).map((tipo) => (
                  <Button
                    key={tipo}
                    type="button"
                    variant={tipoPessoa === tipo ? 'default' : 'outline'}
                    onClick={() => setTipoPessoa(tipo)}
                  >
                    {tipo === 'membro' && 'Membro'}
                    {tipo === 'visitante' && 'Visitante'}
                    {tipo === 'convertido' && 'Novo Convertido'}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

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

          {/* Campos Espirituais */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações Espirituais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    id="participa_celula"
                    checked={participaCelula}
                    onCheckedChange={c => setParticipaCelula(!!c)}
                  />
                  <Label htmlFor="participa_celula">Participa de célula?</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="celula">Qual célula?</Label>
                <Select value={celula} onValueChange={setCelula}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma célula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centro">Célula Centro</SelectItem>
                    <SelectItem value="norte">Célula Norte</SelectItem>
                    <SelectItem value="sul">Célula Sul</SelectItem>
                    <SelectItem value="leste">Célula Leste</SelectItem>
                    <SelectItem value="oeste">Célula Oeste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
              {loading ? 'Salvando...' : 'Salvar Cadastro'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
