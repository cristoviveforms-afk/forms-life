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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TipoPessoa = 'membro' | 'visitante' | 'convertido';

interface Filho {
  nome: string;
  idade: string;
}

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tipoParam = searchParams.get('tipo') as TipoPessoa | null;
  
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(tipoParam || 'membro');
  const [possuiFilhos, setPossuiFilhos] = useState(false);
  const [filhos, setFilhos] = useState<Filho[]>([]);
  const [estadoCivil, setEstadoCivil] = useState('');

  const addFilho = () => {
    setFilhos([...filhos, { nome: '', idade: '' }]);
  };

  const removeFilho = (index: number) => {
    setFilhos(filhos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Cadastro realizado!',
      description: 'Os dados foram salvos com sucesso.',
    });
    navigate(-1);
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
                {(['membro', 'visitante', 'convertido'] as TipoPessoa[]).map((tipo) => (
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
                  <Input id="nome" placeholder="Nome completo" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nascimento">Data de Nascimento</Label>
                  <Input id="nascimento" type="date" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select>
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
                    <Input id="conjuge" placeholder="Nome do cônjuge" />
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
                  <Input id="telefone" placeholder="(00) 00000-0000" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Textarea id="endereco" placeholder="Rua, número, bairro, cidade - UF" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="como_conheceu">Como conheceu a igreja?</Label>
                <Select>
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
                  <Checkbox id="batizado_aguas" />
                  <Label htmlFor="batizado_aguas">Batizado nas águas?</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_batismo">Data do Batismo</Label>
                  <Input id="data_batismo" type="date" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="batizado_espirito" />
                  <Label htmlFor="batizado_espirito">Batizado com Espírito Santo?</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="participa_celula" />
                  <Label htmlFor="participa_celula">Participa de célula?</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="celula">Qual célula?</Label>
                <Select>
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
                <Textarea id="dons_naturais" placeholder="Ex: música, dança, mídia, comunicação..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dons_espirituais">Dons Espirituais e Ministeriais</Label>
                <Textarea id="dons_espirituais" placeholder="Ex: profecia, ensino, liderança, serviço..." />
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
                  <Checkbox id="primeira_vez" />
                  <Label htmlFor="primeira_vez">Primeira vez na igreja?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="deseja_contato" />
                  <Label htmlFor="deseja_contato">Deseja ser contactado?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="deseja_discipulado" />
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
                  <Input id="data_conversao" type="date" required />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="deseja_acompanhamento" />
                  <Label htmlFor="deseja_acompanhamento">Deseja acompanhamento?</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="necessidades">Necessidades Específicas</Label>
                  <Textarea id="necessidades" placeholder="Oração, aconselhamento, etc..." />
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
                  <Input id="data_integracao" type="date" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ja_serviu" />
                  <Label htmlFor="ja_serviu">Já serviu em algum ministério?</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ministerio_anterior">Qual ministério?</Label>
                  <Input id="ministerio_anterior" placeholder="Nome do ministério" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Cadastro
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
