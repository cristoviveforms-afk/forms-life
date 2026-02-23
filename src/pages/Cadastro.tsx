import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Loader2, HeartHandshake, Users, Puzzle, ChevronRight, Sparkles, Camera, Upload, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { PersonType } from '@/types/database';

interface FamilyMember {
  id?: string;
  nome: string;
  parentesco: 'conjuge' | 'noivo' | 'namorado' | 'filho' | 'outro';
  idade?: string;
  observacoes?: string;
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
  'Mídia e Comunicação',
];

const FOLLOWUP_MINISTRIES = [
  'Ministério de Casais',
  'Ministério de Homens',
  'Ministério de Mulheres',
  'Ministério de Jovens',
  'Ministério de Teens',
  'Ministério Infantil (Kids)',
];

interface CadastroProps {
  isPublic?: boolean;
}

export default function Cadastro({ isPublic = false }: CadastroProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tipoParam = searchParams.get('tipo') as PersonType | null;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<PersonType>(tipoParam || (isPublic ? 'membro' : 'membro'));
  const mode = searchParams.get('mode') || 'completo'; // boas-vindas, conexao, completo
  const [visitorQuestionAnswered, setVisitorQuestionAnswered] = useState(mode === 'conexao');
  const [memberRole, setMemberRole] = useState<string>('liderado');
  const [discipuladoLeaderId, setDiscipuladoLeaderId] = useState<string | null>(null);
  const [allPotentialLeaders, setAllPotentialLeaders] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [personId, setPersonId] = useState<string | null>(null);
  const [dateVisitors, setDateVisitors] = useState<any[]>([]);
  const [loadingDateVisitors, setLoadingDateVisitors] = useState(false);

  // Fetch data if personId is provided in URL
  useEffect(() => {
    const editPersonId = searchParams.get('personId') || searchParams.get('id');
    if (editPersonId) {
      loadPersonData(editPersonId);
    }
    fetchPotentialLeaders();
  }, [searchParams]);

  const fetchPotentialLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from('people' as any)
        .select('id, full_name, name')
        .eq('type', 'membro');

      if (data) setAllPotentialLeaders(data);
    } catch (err) {
      console.error('Error fetching leaders:', err);
    }
  };

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
      setVisitorQuestionAnswered(true); // Fix: Mark question as answered when loading existing data
      setMemberRole(data.member_role || 'liderado');
      setDiscipuladoLeaderId(data.leader_id);
      setDiscipuladoLeaderId(data.leader_id);
      setFamilyId(data.family_id);

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
      setCpf(data.cpf || '');
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
      setMinistryRoles(data.ministry_roles || {});
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
        setAvatarUrl(data.avatar_url || '');
        setMemberRole(data.member_role || 'liderado');
        setDiscipuladoLeaderId(data.leader_id || null);
      }

      setQuemConvidou(data.invited_by || '');

      // Fetch Family Members if family_id exists
      if (data.family_id) {
        const { data: familyData } = await supabase
          .from('people' as any)
          .select('*')
          .eq('family_id', data.family_id)
          .neq('id', data.id);

        if (familyData && familyData.length > 0) {
          const members: FamilyMember[] = familyData.map((m: any) => {
            // Determine parentesco based on what we saved
            let parentesco: any = 'outro';
            if (m.civil_status === 'conjuge' || m.civil_status === 'casado') parentesco = 'conjuge';
            else if (m.civil_status === 'noivo') parentesco = 'noivo';
            else if (m.civil_status === 'namorado') parentesco = 'namorado';
            else if (m.ministries?.includes('Ministério Infantil (Kids)')) parentesco = 'filho';

            return {
              id: m.id, // Keep ID for potential updates
              nome: m.full_name || '',
              parentesco: parentesco,
              idade: m.birth_date ? (new Date().getFullYear() - new Date(m.birth_date).getFullYear()).toString() : '',
              observacoes: m.observations || ''
            };
          });

          setFamilyMembers(members);

          // Sync with legacy states
          const spouse = members.find(m => ['conjuge', 'noivo', 'namorado'].includes(m.parentesco));
          if (spouse) {
            setConjuge(spouse.nome);
            if (spouse.parentesco === 'conjuge') setEstadoCivil('casado');
            else setEstadoCivil(spouse.parentesco);
          }

          const children = members.filter(m => m.parentesco === 'filho');
          if (children.length > 0) {
            setPossuiFilhos(true);
            setFilhos(children.map(c => ({ nome: c.nome, idade: c.idade, observacoes: c.observacoes })));
          }
        }
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

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [possuiFilhos, setPossuiFilhos] = useState(false);
  const [filhos, setFilhos] = useState<any[]>([]);

  // State for form fields
  const [nome, setNome] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [conjuge, setConjuge] = useState('');

  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [comoConheceu, setComoConheceu] = useState('');
  const [acceptedJesus, setAcceptedJesus] = useState(false);

  const [batizadoAguas, setBatizadoAguas] = useState(false);
  const [dataBatismo, setDataBatismo] = useState('');
  const [batizadoEspirito, setBatizadoEspirito] = useState(false);
  const [participaMinisterio, setParticipaMinisterio] = useState(false);
  const [ministeriosServindo, setMinisteriosServindo] = useState<string[]>([]);
  const [ministeriosAcompanhamento, setMinisteriosAcompanhamento] = useState<string[]>([]);
  const [ministryRoles, setMinistryRoles] = useState<Record<string, string>>({});
  const [donsNaturais, setDonsNaturais] = useState('');
  const [donsEspirituais, setDonsEspirituais] = useState('');

  // Specific fields
  const [visitantePrimeiraVez, setVisitantePrimeiraVez] = useState(false);
  const [visitanteQuerContato, setVisitanteQuerContato] = useState(false);
  const [visitanteQuerDiscipulado, setVisitanteQuerDiscipulado] = useState(false);
  const [outraReligiao, setOutraReligiao] = useState('');
  const [pedidoOracao, setPedidoOracao] = useState('');

  const [dataConversao, setDataConversao] = useState(new Date().toISOString().split('T')[0]);
  const [convertidoQuerAcompanhamento, setConvertidoQuerAcompanhamento] = useState(false);
  const [necessidades, setNecessidades] = useState('');

  const [dataIntegracao, setDataIntegracao] = useState(new Date().toISOString().split('T')[0]);
  const [jaServiu, setJaServiu] = useState(false);
  const [ministerioAnterior, setMinisterioAnterior] = useState('');
  const [quemConvidou, setQuemConvidou] = useState('');


  const handleDateChange = async (start: string, end: string) => {
    if (mode !== 'conexao' || personId) return;

    setLoadingDateVisitors(true);
    try {
      const { data, error } = await supabase
        .from('people' as any)
        .select(`
          id,
          full_name,
          phone,
          created_at,
          children (count)
        `)
        .eq('type', 'visitante')
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDateVisitors(data || []);
    } catch (error) {
      console.error('Erro ao buscar visitantes por data:', error);
    } finally {
      setLoadingDateVisitors(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast({
        title: "Foto carregada",
        description: "A imagem de perfil foi enviada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro no upload do avatar:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível carregar a foto.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addFamilyMember = (parentesco: FamilyMember['parentesco'] = 'filho') =>
    setFamilyMembers([...familyMembers, { nome: '', parentesco, idade: '', observacoes: '' }]);

  const removeFamilyMember = (index: number) =>
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));

  const addFilho = () => setFilhos([...filhos, { nome: '', idade: '', observacoes: '' }]);
  const removeFilho = (index: number) => setFilhos(filhos.filter((_, i) => i !== index));

  // Sincronização automática entre familyMembers e conjuge/filhos (para modo visitante)
  useEffect(() => {
    if (tipoPessoa === 'visitante' && familyMembers.length > 0) {
      // Sincroniza cônjuge
      const spouse = familyMembers.find(m => ['conjuge', 'noivo', 'namorado'].includes(m.parentesco));
      if (spouse && spouse.nome && spouse.nome !== conjuge) {
        setConjuge(spouse.nome);
        if (spouse.parentesco === 'conjuge') setEstadoCivil('casado');
        else if (spouse.parentesco === 'noivo') setEstadoCivil('noivo');
        else if (spouse.parentesco === 'namorado') setEstadoCivil('namorado');
      }

      // Sincroniza filhos
      const children = familyMembers.filter(m => m.parentesco === 'filho');
      if (children.length > 0) {
        setPossuiFilhos(true);
        // Só atualiza se houver mudança real para evitar loops
        const currentFilhosNames = JSON.stringify(filhos.map(f => f.nome));
        const newFilhosNames = JSON.stringify(children.map(c => c.nome));
        if (currentFilhosNames !== newFilhosNames) {
          setFilhos(children.map(c => ({ nome: c.nome, idade: c.idade, observacoes: c.observacoes })));
        }
      }
    }
  }, [familyMembers, tipoPessoa]);

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
    setMinisteriosServindo(prev => {
      if (prev.includes(ministerio)) {
        // Remove ministry and its role
        const { [ministerio]: _, ...remainingRoles } = ministryRoles;
        setMinistryRoles(remainingRoles);
        return prev.filter(m => m !== ministerio);
      } else {
        // Add ministry and set default role to 'liderado'
        setMinistryRoles(prevRoles => ({ ...prevRoles, [ministerio]: 'liderado' }));
        return [...prev, ministerio];
      }
    });
  };

  const handleMinistryRoleChange = (ministerio: string, role: string) => {
    setMinistryRoles(prev => ({
      ...prev,
      [ministerio]: role
    }));
  };

  const toggleMinisterioAcompanhamento = (ministerio: string) => {
    setMinisteriosAcompanhamento(prev =>
      prev.includes(ministerio)
        ? prev.filter(m => m !== ministerio)
        : [...prev, ministerio]
    );
  };

  const handleSearchVisitor = async () => {
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

      const cleanSearch = searchPhone.replace(/\D/g, ''); // Remove non-digits

      if (cleanSearch.length === 11) {
        // Search by CPF
        query = query.eq('cpf', cleanSearch);
      } else if (cleanSearch.length <= 4) {
        // Search by phone suffix
        query = query.ilike('phone', `%${cleanSearch}`).order('created_at', { ascending: false }).limit(1);
      } else {
        // Exact match phone
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
      setCpf(data.cpf || '');
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
        setFilhos(data.children.map((c: any) => ({ nome: c.name, idade: c.age || '', observacoes: c.observations || '' })));
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
      let currentFamilyId = familyId;

      if (!personId && !currentFamilyId) {
        // If new person, generate a family ID
        currentFamilyId = crypto.randomUUID();
        setFamilyId(currentFamilyId);
      }

      const payload: any = {
        type: tipoPessoa,
        full_name: nome,
        birth_date: nascimento || null,
        gender: sexo || null,
        civil_status: estadoCivil || null,
        spouse_name: (estadoCivil === 'casado' || estadoCivil === 'noivo' || estadoCivil === 'namorado') ? conjuge : null,
        family_id: currentFamilyId,

        phone: telefone.replace(/\D/g, ''),
        cpf: cpf.replace(/\D/g, '') || null,
        email: email || null,
        address: endereco || null,
        how_met: comoConheceu || null,

        baptized_water: batizadoAguas,
        baptism_date: dataBatismo || null,
        baptized_spirit: batizadoEspirito,
        member_role: tipoPessoa === 'membro' ? memberRole : null,
        leader_id: tipoPessoa === 'membro' ? discipuladoLeaderId : null,
        ministries: [...ministeriosServindo, ...ministeriosAcompanhamento],
        ministry_roles: ministryRoles,
        natural_skills: donsNaturais || null,
        spiritual_gifts: donsEspirituais || null,

        visitor_first_time: tipoPessoa === 'visitante' ? visitantePrimeiraVez : false,
        visitor_wants_contact: tipoPessoa === 'visitante' ? visitanteQuerContato : false,
        visitor_wants_discipleship: tipoPessoa === 'visitante' ? visitanteQuerDiscipulado : false,
        visitor_religion: tipoPessoa === 'visitante' ? outraReligiao : null,
        visitor_prayer_request: tipoPessoa === 'visitante' ? pedidoOracao : null,

        conversion_date: tipoPessoa === 'convertido' ? (dataConversao || new Date().toISOString().split('T')[0]) : null,
        convert_wants_accompaniment: tipoPessoa === 'convertido' ? convertidoQuerAcompanhamento : false,
        convert_needs: tipoPessoa === 'convertido' ? necessidades : null,

        integration_date: tipoPessoa === 'membro' ? (dataIntegracao || new Date().toISOString().split('T')[0]) : null,
        member_has_served: tipoPessoa === 'membro' ? jaServiu : false,
        member_prev_ministry: tipoPessoa === 'membro' && jaServiu ? ministerioAnterior : null,

        invited_by: quemConvidou || null,
        accepted_jesus: acceptedJesus,
        journey_stage: personId ? undefined : 'fase1_porta', // Default stage for new registrations

        // Hierarchy and profile
        avatar_url: avatarUrl || null,
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

      // 2. Manage Family Members
      if (person) {
        for (const member of familyMembers) {
          if (!member.nome) continue;

          const memberPayload: any = {
            type: 'visitante',
            full_name: member.nome,
            family_id: currentFamilyId,
            civil_status: member.parentesco === 'conjuge' ? 'conjuge' :
              member.parentesco === 'noivo' ? 'noivo' :
                member.parentesco === 'namorado' ? 'namorado' : null,
            spouse_name: (member.parentesco === 'conjuge' || member.parentesco === 'noivo' || member.parentesco === 'namorado') ? nome : null,
            birth_date: member.idade && !isNaN(parseInt(member.idade))
              ? new Date(new Date().getFullYear() - parseInt(member.idade), 0, 1).toISOString()
              : null,
            observations: member.observacoes || null,
            // Tagging as Kids Ministry if it's a child
            ministries: member.parentesco === 'filho' ? ['Ministério Infantil (Kids)'] : []
          };

          if (member.id) {
            await supabase.from('people' as any).update(memberPayload).eq('id', member.id);
          } else {
            await supabase.from('people' as any).insert(memberPayload);
          }
        }
      }

      toast({
        title: personId ? 'Cadastro atualizado!' : 'Cadastro realizado!',
        description: 'Os dados foram salvos com sucesso.',
      });
      if (isPublic) {
        setSubmitted(true);
      } else {
        // Navigate explicitly to avoid history issues on mobile
        navigate('/dashboard');
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

  const renderSuccess = () => (
    <div className="text-center space-y-6 py-12 animate-fade-in">
      <div className="flex justify-center">
        <div className="bg-emerald-100 dark:bg-emerald-950 p-4 rounded-full">
          <CheckCircle2 className="h-16 w-16 text-emerald-600" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Cadastro Realizado!</h2>
        <p className="text-muted-foreground text-lg">
          Seja muito bem-vindo à nossa família. Seus dados foram salvos com sucesso.
          Que Deus te abençoe grandemente!
        </p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()} className="rounded-full">
        Fazer novo cadastro
      </Button>
    </div>
  );

  const formContent = (
    <div className={cn("max-w-4xl mx-auto px-2 md:px-0", isPublic ? "pb-20" : "")}>
      {!isPublic && (
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Dashboard
        </Button>
      )}

      {isPublic && submitted ? (
        <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden rounded-[2rem] border border-white/10 mt-10">
          <CardContent className="pt-10 pb-8 px-8">
            {renderSuccess()}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          {isPublic && (
            <div className="text-center mb-8 pt-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 animate-bounce">
                <Sparkles size={14} className="fill-primary" /> Cadastro de Membros
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Ficha de Cadastro</h1>
              <p className="text-muted-foreground">Preencha seus dados para fazer parte da nossa comunidade.</p>
            </div>
          )}

          {/* Tipo de Cadastro - Hidden if Public (defaults to Membro) */}
          {mode === 'completo' && !isPublic && (
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
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ... Rest of the form remains same ... */}
          {/* I will use the actual form content here, wrapped in conditional logic */}
          {/* Due to the size of the file, I'll keep the existing structure but replace the root elements */}

          {/* Pergunta Inicial para Visitante - Only in Boas-Vindas */}
          {tipoPessoa === 'visitante' && mode === 'boas-vindas' && !visitorQuestionAnswered && !isReturningVisitor && (
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
                    }}
                  >
                    Retornando
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Busca de Visitante Retornante - Only in Boas-Vindas */}
          {isReturningVisitor && mode === 'boas-vindas' && !visitorQuestionAnswered && (
            <Card className="mb-6 animate-in zoom-in-95">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Pesquisar Cadastro Existente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Busque pelo telefone (Ex: 11999999999)"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
                    className="h-12 rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSearchVisitor()}
                    disabled={loading || !searchPhone}
                    className="h-12 px-6 rounded-xl font-bold"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Pesquisar'}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 px-1">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Isso ajuda a não duplicar o cadastro e manter o histórico.
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-slate-400"
                  onClick={() => setIsReturningVisitor(false)}
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Seleção por Calendário para Conexão */}
          {mode === 'conexao' && !personId && (
            <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="text-center space-y-3 py-6 relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-primary/5 to-transparent border border-primary/10 mb-2">
                <div className="absolute inset-0 bg-grid-slate-100/[0.03] bg-[size:20px_20px]" />
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary animate-in fade-in zoom-in duration-1000">
                  <HeartHandshake className="h-4 w-4 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ambiente de Conexão</span>
                </div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Localizar Visitante</h3>
                <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Posicione o calendário e escolha o dia da visita para finalizar a ficha</p>
              </div>

              <MonthYearPicker onDateChange={handleDateChange} />

              <div className="grid grid-cols-1 gap-3">
                {loadingDateVisitors ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-slate-500">Buscando registros...</p>
                  </div>
                ) : dateVisitors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateVisitors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => navigate(`/cadastro?id=${v.id}&mode=conexao&tipo=visitante`)}
                        className="flex items-center gap-4 p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] border-2 border-slate-100/50 dark:border-slate-800/50 hover:border-primary/50 hover:bg-primary/[0.04] transition-all text-left shadow-lg group"
                      >
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-primary font-black group-hover:scale-105 group-hover:shadow-lg transition-all">
                          {v.full_name ? v.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-slate-800 dark:text-slate-100">{v.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {v.children?.[0]?.count > 0 && (
                              <Badge className="h-4 text-[9px] bg-orange-100 text-orange-600 border-none font-bold uppercase">Com Filhos</Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <Users className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Nenhum visitante encontrado nesta data.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header de Dados Gerais (Resumo) - visível em ambos os modos se estiver editando */}
          {personId && (
            <Card className="mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative shadow-2xl backdrop-blur-xl rounded-[2.5rem] animate-in slide-in-from-top-4">
              <div className="absolute right-0 top-0 h-full w-48 bg-primary/10 -skew-x-12 translate-x-24 blur-3xl" />
              <CardContent className="p-6">
                <div className="flex items-center gap-4 relative">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black shadow-inner">
                    {nome ? nome.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">{nome || 'Visitante sem nome'}</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-primary/20 text-primary font-bold">
                        {(tipoPessoa || '').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        {telefone || 'Sem telefone'}
                      </span>
                      {mode === 'boas-vindas' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">MODO BOAS-VINDAS</Badge>
                      )}
                      {mode === 'conexao' && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">MODO CONEXÃO</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados Pessoais e Restante do Formulário - Hidden in Conexão if no person selected */}
          {((tipoPessoa !== 'visitante' || visitorQuestionAnswered) && (mode !== 'conexao' || personId)) && (
            <>
              {/* LAYOUT PARA VISITANTES */}
              {tipoPessoa === 'visitante' ? (
                <div className="space-y-6">
                  {/* Bloco 1: Boas Vindas (Dados Pessoais) - Sempre visível em Boas-Vindas ou Completo */}
                  {(mode === 'boas-vindas' || mode === 'completo') && (
                    <Card className="mb-6 border-l-4 border-l-primary/50 shadow-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-xl text-primary">
                            <HeartHandshake className="h-5 w-5" />
                          </div>
                          <CardTitle>Boas Vindas - Dados Pessoais</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome" className="font-bold">Nome Completo *</Label>
                          <Input
                            id="nome"
                            placeholder="Nome completo do visitante"
                            required
                            className="h-12 rounded-xl"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="telefone" className="font-bold">WhatsApp / Telefone *</Label>
                            <Input
                              id="telefone"
                              placeholder="(00) 00000-0000"
                              required
                              className="h-12 rounded-xl font-medium"
                              value={telefone}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 2) setTelefone(val);
                                else if (val.length <= 7) setTelefone(`(${val.slice(0, 2)}) ${val.slice(2)}`);
                                else setTelefone(`(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7, 11)}`);
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sexo" className="font-bold">Sexo</Label>
                            <Select value={sexo} onValueChange={setSexo}>
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="masculino">Masculino</SelectItem>
                                <SelectItem value="feminino">Feminino</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="quem_convidou" className="font-bold">Quem convidou?</Label>
                            <Input
                              id="quem_convidou"
                              placeholder="Nome de quem o convidou"
                              className="h-12 rounded-xl"
                              value={quemConvidou}
                              onChange={e => setQuemConvidou(e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Bloco de Família - Independente do modo para Visitantes */}
                  {(mode === 'boas-vindas' || mode === 'conexao' || mode === 'completo') && (
                    <Card className="mb-6 border-l-4 border-l-slate-400 shadow-md">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                              <Users className="h-5 w-5" />
                            </div>
                            <CardTitle>Família / Acompanhantes</CardTitle>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl h-9 text-xs font-bold"
                              onClick={() => addFamilyMember('conjuge')}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" /> Cônjuge/Noivo
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl h-9 text-xs font-bold"
                              onClick={() => addFamilyMember('filho')}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" /> Filho
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {familyMembers.length > 0 ? (
                          <div className="space-y-4">
                            {familyMembers.map((member, index) => (
                              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 relative group/member animate-in fade-in slide-in-from-top-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                  onClick={() => removeFamilyMember(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                  <div className="lg:col-span-12 xl:col-span-5 space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Nome Completo</Label>
                                    <Input
                                      placeholder="Nome do familiar"
                                      className="h-10 rounded-xl bg-white dark:bg-slate-900"
                                      value={member.nome}
                                      onChange={e => {
                                        const newMembers = [...familyMembers];
                                        newMembers[index].nome = e.target.value;
                                        setFamilyMembers(newMembers);
                                      }}
                                    />
                                  </div>
                                  <div className="lg:col-span-6 xl:col-span-4 space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Parentesco</Label>
                                    <Select
                                      value={member.parentesco}
                                      onValueChange={val => {
                                        const newMembers = [...familyMembers];
                                        newMembers[index].parentesco = val as any;
                                        setFamilyMembers(newMembers);
                                      }}
                                    >
                                      <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {member.parentesco === 'filho' ? (
                                          <SelectItem value="filho">Filho(a)</SelectItem>
                                        ) : (
                                          <>
                                            <SelectItem value="conjuge">Cônjuge</SelectItem>
                                            <SelectItem value="noivo">Noivo(a)</SelectItem>
                                            <SelectItem value="namorado">Namorado(a)</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                          </>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="lg:col-span-6 xl:col-span-3 space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Idade/Observação</Label>
                                    <Input
                                      placeholder="Ex: 5 anos"
                                      className="h-10 rounded-xl bg-white dark:bg-slate-900"
                                      value={member.idade}
                                      onChange={e => {
                                        const newMembers = [...familyMembers];
                                        newMembers[index].idade = e.target.value;
                                        setFamilyMembers(newMembers);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed rounded-2xl border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-400 font-medium italic">Nenhum familiar cadastrado junto.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Bloco 2: Conexão (Dados de Contato e Endereço) - Sempre visível em Conexão ou Completo */}
                  {(mode === 'conexao' || mode === 'completo') && (
                    <div className="space-y-6">
                      <Card className="mb-6 border-l-4 border-l-indigo-500 shadow-md">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                              <Puzzle className="h-5 w-5" />
                            </div>
                            <CardTitle>Conexão - Dados de Contato e Endereço</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nascimento">Data de Nascimento</Label>
                              <Input
                                id="nascimento"
                                type="date"
                                className="h-12 rounded-xl"
                                value={nascimento}
                                onChange={e => setNascimento(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="estado_civil">Estado Civil</Label>
                              <Select value={estadoCivil} onValueChange={setEstadoCivil}>
                                <SelectTrigger className="h-12 rounded-xl">
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
                                  className="h-12 rounded-xl"
                                  value={conjuge}
                                  onChange={e => setConjuge(e.target.value)}
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="email_visitante">Email</Label>
                              <Input
                                id="email_visitante"
                                type="email"
                                placeholder="email@exemplo.com"
                                className="h-12 rounded-xl"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="como_conheceu">Como conheceu a igreja?</Label>
                              <Select value={comoConheceu} onValueChange={setComoConheceu}>
                                <SelectTrigger className="h-12 rounded-xl">
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

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="endereco_visitante">Endereço Completo</Label>
                              <Textarea
                                id="endereco_visitante"
                                placeholder="Rua, número, bairro, cidade - UF"
                                className="rounded-xl min-h-[80px]"
                                value={endereco}
                                onChange={e => setEndereco(e.target.value)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="mb-6 border-l-4 border-l-blue-400 shadow-md">
                        <CardHeader>
                          <CardTitle>Informações Espirituais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2 py-4 md:col-span-2">
                            <Checkbox
                              id="accepted_jesus_final"
                              checked={acceptedJesus}
                              onCheckedChange={(checked) => setAcceptedJesus(!!checked)}
                            />
                            <Label htmlFor="accepted_jesus_final" className="font-semibold text-primary">
                              Aceitou Jesus hoje? (Novo Convertido)
                            </Label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 py-2">
                              <Checkbox
                                id="batizado_aguas_v"
                                checked={batizadoAguas}
                                onCheckedChange={(c) => setBatizadoAguas(!!c)}
                              />
                              <Label htmlFor="batizado_aguas_v">Batizado nas águas?</Label>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="data_batismo_v">Data do Batismo</Label>
                              <Input
                                id="data_batismo_v"
                                type="date"
                                className="h-12 rounded-xl"
                                value={dataBatismo}
                                onChange={e => setDataBatismo(e.target.value)}
                              />
                            </div>

                            <div className="flex items-center space-x-2 py-2">
                              <Checkbox
                                id="batizado_espirito_v"
                                checked={batizadoEspirito}
                                onCheckedChange={c => setBatizadoEspirito(!!c)}
                              />
                              <Label htmlFor="batizado_espirito_v">Batizado com Espírito Santo?</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Ministries for Follow-Up */}
                      <Card className="mb-6 border-blue-200 bg-blue-50/20 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            Ministérios para Acompanhamento
                            <span className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-tighter">Sugeridos pelo perfil</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {FOLLOWUP_MINISTRIES.map((ministry) => (
                              <div key={ministry} className="flex items-center space-x-2 p-2 rounded-xl hover:bg-white/60 transition-colors">
                                <Checkbox
                                  id={`followup-${ministry}`}
                                  checked={ministeriosAcompanhamento.includes(ministry)}
                                  onCheckedChange={() => toggleMinisterioAcompanhamento(ministry)}
                                />
                                <Label htmlFor={`followup-${ministry}`} className="cursor-pointer flex-1 text-sm">
                                  {ministry}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                /* LAYOUT PADRÃO (MEMBROS E OUTROS) */
                <div className="space-y-6">
                  <Card className="mb-6 shadow-md border-t-4 border-t-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Informações Básicas e Contato
                      </CardTitle>
                      <CardDescription>Dados essenciais para identificação e comunicação.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">


                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                        <div className="md:col-span-8 space-y-2">
                          <Label htmlFor="nome_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome Completo *</Label>
                          <Input
                            id="nome_membro"
                            placeholder="Ex: João Silva da Costa"
                            required
                            className="h-11 rounded-xl"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <Label htmlFor="contato_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp *</Label>
                          <Input
                            id="contato_membro"
                            placeholder="(00) 00000-0000"
                            required
                            className="h-11 rounded-xl"
                            value={telefone}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 2) setTelefone(val);
                              else if (val.length <= 7) setTelefone(`(${val.slice(0, 2)}) ${val.slice(2)}`);
                              else setTelefone(`(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7, 11)}`);
                            }}
                          />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                          <Label htmlFor="sexo_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Sexo</Label>
                          <Select value={sexo} onValueChange={setSexo}>
                            <SelectTrigger id="sexo_membro" className="h-11 rounded-xl">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-3 space-y-2">
                          <Label htmlFor="nascimento_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nascimento</Label>
                          <Input
                            id="nascimento_membro"
                            type="date"
                            className="h-11 rounded-xl"
                            value={nascimento}
                            onChange={e => setNascimento(e.target.value)}
                          />
                        </div>

                        <div className="md:col-span-6 space-y-2">
                          <Label htmlFor="email_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Profissional/Pessoal</Label>
                          <Input
                            id="email_membro"
                            type="email"
                            placeholder="exemplo@igreja.com"
                            className="h-11 rounded-xl"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                          />
                        </div>

                        {/* Filhos (Layout Membro) - Movido para baixo de Sexo/Email como solicitado */}
                        <div className="md:col-span-12 space-y-4 py-4 border-y border-slate-100 dark:border-slate-800">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="possui_filhos"
                              checked={possuiFilhos}
                              onCheckedChange={(checked) => {
                                setPossuiFilhos(!!checked);
                                if (!checked) setFilhos([]);
                              }}
                            />
                            <Label htmlFor="possui_filhos" className="text-base font-bold text-primary cursor-pointer">Filhos</Label>
                          </div>

                          {possuiFilhos && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                              {filhos.map((filho, index) => (
                                <div key={index} className="p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFilho(index)}
                                    className="absolute top-2 right-2 h-7 w-7 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <div className="space-y-3">
                                    <div className="flex gap-2">
                                      <div className="flex-1 space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Nome</Label>
                                        <Input
                                          value={filho.nome}
                                          onChange={(e) => {
                                            const newFilhos = [...filhos];
                                            newFilhos[index].nome = e.target.value;
                                            setFilhos(newFilhos);
                                          }}
                                          placeholder="Nome"
                                          className="h-9 rounded-lg bg-white dark:bg-slate-900"
                                        />
                                      </div>
                                      <div className="w-20 space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Idade</Label>
                                        <Input
                                          value={filho.idade}
                                          onChange={(e) => {
                                            const newFilhos = [...filhos];
                                            newFilhos[index].idade = e.target.value;
                                            setFilhos(newFilhos);
                                          }}
                                          placeholder="Ex: 5"
                                          className="h-9 rounded-lg bg-white dark:bg-slate-900"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-bold uppercase text-slate-400">Observações</Label>
                                      <Input
                                        value={filho.observacoes}
                                        onChange={(e) => {
                                          const newFilhos = [...filhos];
                                          newFilhos[index].observacoes = e.target.value;
                                          setFilhos(newFilhos);
                                        }}
                                        placeholder="Alergias, etc"
                                        className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <Button type="button" variant="outline" size="sm" onClick={addFilho} className="rounded-xl border-dashed border-2 md:col-span-2 py-6 hover:bg-slate-50 transition-colors">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Dependente / Filho
                              </Button>
                            </div>
                          )}
                        </div>


                        <div className="md:col-span-12 space-y-2">
                          <Label htmlFor="endereco_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Residência Atual</Label>
                          <Input
                            id="endereco_membro"
                            placeholder="Rua, número, bairro, cidade - UF"
                            className="h-11 rounded-xl"
                            value={endereco}
                            onChange={e => setEndereco(e.target.value)}
                          />
                        </div>

                        <div className="md:col-span-6 space-y-2">
                          <Label htmlFor="como_conheceu_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Como conheceu a Vida?</Label>
                          <Select value={comoConheceu} onValueChange={setComoConheceu}>
                            <SelectTrigger id="como_conheceu_membro" className="h-11 rounded-xl">
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

                        <div className="md:col-span-6 space-y-2">
                          <Label htmlFor="quem_convidou_membro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Quem o convidou?</Label>
                          <Input
                            id="quem_convidou_membro"
                            placeholder="Nome de quem o trouxe"
                            className="h-11 rounded-xl"
                            value={quemConvidou}
                            onChange={e => setQuemConvidou(e.target.value)}
                          />
                        </div>

                        {tipoPessoa === 'membro' && (
                          <div className="md:col-span-12 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-2">
                              Foto de Perfil
                            </Label>
                            <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-900/80 group">
                              <div className="relative">
                                <div className="h-24 w-24 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" />
                                  ) : (
                                    <Camera className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                  )}
                                  {uploadingAvatar && (
                                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center backdrop-blur-sm">
                                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                  )}
                                </div>
                                {avatarUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setAvatarUrl('')}
                                    className="absolute -top-2 -right-2 h-6 w-6 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>

                              <div className="flex-1 space-y-2 text-center md:text-left">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                  {avatarUrl ? 'Foto carregada com sucesso!' : 'Selecione uma foto de perfil'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB.
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      onChange={handleAvatarUpload}
                                      disabled={uploadingAvatar}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl h-10 px-4 font-bold border-primary/20 hover:bg-primary/5 text-primary"
                                      disabled={uploadingAvatar}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      {avatarUrl ? 'Trocar Foto' : 'Anexar Foto'}
                                    </Button>
                                  </div>
                                  {avatarUrl && (
                                    <Badge variant="outline" className="h-10 px-4 rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-bold">
                                      URL vinculada
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Hidden field for form data, or keep the URL input optionally? 
                                User asked to "place option to attach image", didn't explicitly say remove the URL option, 
                                but in professional forms we usually replace it or make it an alternative.
                                I'll keep the input hidden or very subtle for reference if needed. */}
                            <input type="hidden" value={avatarUrl} name="avatar_url" />
                          </div>
                        )}
                      </div>


                    </CardContent>
                  </Card>

                  {/* Informações Espirituais para Membros */}
                  {tipoPessoa === 'membro' && (
                    <Card className="mb-6 shadow-md border-t-4 border-t-blue-500 overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-blue-500" />
                          Vida Espiritual e Comissionamento
                        </CardTitle>
                        <CardDescription>Informações sobre sua jornada de fé e serviço na igreja.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="data_conversao" className="text-xs font-bold uppercase tracking-wider text-slate-500">Data da Conversão</Label>
                            <Input
                              id="data_conversao"
                              type="date"
                              className="h-11 rounded-xl"
                              value={dataConversao}
                              onChange={e => setDataConversao(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="data_batismo" className="text-xs font-bold uppercase tracking-wider text-slate-500">Data do Batismo</Label>
                            <Input
                              id="data_batismo"
                              type="date"
                              className="h-11 rounded-xl"
                              value={dataBatismo}
                              onChange={e => setDataBatismo(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="member_role" className="text-xs font-bold uppercase tracking-wider text-slate-500">Posição Ministerial</Label>
                            <Select value={memberRole} onValueChange={(val: any) => setMemberRole(val)}>
                              <SelectTrigger id="member_role" className="h-11 rounded-xl">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lider">Líder</SelectItem>
                                <SelectItem value="liderado">Liderado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
                          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all border border-slate-100 dark:border-slate-800">
                            <Checkbox
                              id="batizado_aguas"
                              checked={batizadoAguas}
                              onCheckedChange={(c) => setBatizadoAguas(!!c)}
                              className="h-5 w-5 rounded-md"
                            />
                            <Label htmlFor="batizado_aguas" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">Batizado nas águas</Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all border border-slate-100 dark:border-slate-800">
                            <Checkbox
                              id="batizado_espirito"
                              checked={batizadoEspirito}
                              onCheckedChange={c => setBatizadoEspirito(!!c)}
                              className="h-5 w-5 rounded-md"
                            />
                            <Label htmlFor="batizado_espirito" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">Batizado c/ Espírito Santo</Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all border border-blue-100/50 dark:border-blue-800/50">
                            <Checkbox
                              id="participa_ministerio"
                              checked={participaMinisterio}
                              onCheckedChange={c => {
                                setParticipaMinisterio(!!c);
                                if (!c) setMinisteriosServindo([]);
                              }}
                              className="h-5 w-5 rounded-md data-[state=checked]:bg-blue-600"
                            />
                            <Label htmlFor="participa_ministerio" className="text-sm font-extrabold text-blue-700 dark:text-blue-400 cursor-pointer">Participa de Ministérios?</Label>
                          </div>
                        </div>

                        {participaMinisterio && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* Ecosystem Panel Refined */}
                            <div className="rounded-3xl bg-[#0a192f] text-white p-6 shadow-2xl relative overflow-hidden border border-amber-500/20">
                              <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                                <Sparkles className="h-32 w-32 text-amber-500" />
                              </div>
                              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full" />

                              <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-black uppercase tracking-tighter text-amber-500 leading-none">Ecossistema</h4>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Parando por Um</p>
                                  </div>
                                </div>
                                <Badge className="bg-amber-500 text-[#0a192f] hover:bg-amber-400 font-black px-3 py-1 uppercase tracking-tighter border-none">Premium</Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-3">
                                  <Label className="text-xs font-bold text-slate-200 uppercase tracking-wider">Sua Posição</Label>
                                  <Select value={memberRole} onValueChange={setMemberRole}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-amber-500/50">
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a192f] text-white border-white/10">
                                      <SelectItem value="lider" className="focus:bg-amber-500/20 focus:text-amber-500">Líder (Gera frutos)</SelectItem>
                                      <SelectItem value="liderado" className="focus:bg-amber-500/20 focus:text-amber-500">Liderado (Em crescimento)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-xs font-bold text-slate-200 uppercase tracking-wider">Quem te pastoreia?</Label>
                                  <Select
                                    value={discipuladoLeaderId || "none"}
                                    onValueChange={(val) => setDiscipuladoLeaderId(val === "none" ? null : val)}
                                  >
                                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-amber-500/50">
                                      <SelectValue placeholder="Selecione o Líder" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a192f] text-white border-white/10 max-h-[250px]">
                                      <SelectItem value="none" className="focus:bg-amber-500/20 focus:text-amber-500 text-slate-400 italic">Sem Líder Direto</SelectItem>
                                      {allPotentialLeaders
                                        .filter(l => l.id !== personId)
                                        .map(leader => (
                                          <SelectItem key={leader.id} value={leader.id} className="focus:bg-amber-500/20 focus:text-amber-500">
                                            {leader.full_name || leader.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>

                            {/* Ministries List Refined */}
                            <div className="space-y-4 pt-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Selecione os Ministérios Atuais:</Label>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Escolha todos que participa</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {MINISTERIOS_LIST.map((ministerio) => (
                                  <div
                                    key={ministerio}
                                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${ministeriosServindo.includes(ministerio)
                                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/10'
                                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 hover:shadow-sm'
                                      }`}
                                  >
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center space-x-3">
                                        <Checkbox
                                          id={`ministerio-${ministerio}`}
                                          checked={ministeriosServindo.includes(ministerio)}
                                          onCheckedChange={() => toggleMinisterioServindo(ministerio)}
                                          className="h-5 w-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-none"
                                        />
                                        <Label htmlFor={`ministerio-${ministerio}`} className={`text-sm font-bold cursor-pointer flex-1 truncate ${ministeriosServindo.includes(ministerio)
                                          ? 'text-emerald-900 dark:text-emerald-300'
                                          : 'text-slate-700 dark:text-slate-400'
                                          }`}>
                                          {ministerio}
                                        </Label>
                                      </div>

                                      {ministeriosServindo.includes(ministerio) && (
                                        <div className="pl-8 animate-in fade-in slide-in-from-top-1">
                                          <Select
                                            value={ministryRoles[ministerio] || 'liderado'}
                                            onValueChange={(value) => handleMinistryRoleChange(ministerio, value)}
                                          >
                                            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 rounded-xl">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="liderado">Membro / Voluntário</SelectItem>
                                              <SelectItem value="lider" className="font-bold text-emerald-600">Líder Responsável</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                          <div className="space-y-2">
                            <Label htmlFor="dons_naturais" className="text-xs font-bold uppercase tracking-wider text-slate-500">Dons Naturais</Label>
                            <Textarea
                              id="dons_naturais"
                              placeholder="Habilidades técnicas ou manuais (ex: música, design, culinária)"
                              className="rounded-xl resize-none text-sm min-h-[100px]"
                              value={donsNaturais}
                              onChange={e => setDonsNaturais(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dons_espirituais" className="text-xs font-bold uppercase tracking-wider text-slate-500">Dons Espirituais</Label>
                            <Textarea
                              id="dons_espirituais"
                              placeholder="Dons recebidos pelo Espírito (ex: profecia, serviço, ensino)"
                              className="rounded-xl resize-none text-sm min-h-[100px]"
                              value={donsEspirituais}
                              onChange={e => setDonsEspirituais(e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}


                  {/* Submit */}
                  <div className="flex flex-col-reverse md:flex-row gap-4 justify-end pt-4 mb-10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                      className="w-full md:w-auto h-12 rounded-xl px-10"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto h-12 rounded-xl px-12 font-bold shadow-lg"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? 'Salvando...' : (personId ? 'Atualizar Cadastro' : 'Salvar Cadastro')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bottom Padding for Mobile */}
          <div className="h-20 md:hidden" />
        </form>
      )}
    </div>
  );

  if (isPublic) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 font-sans">
        {formContent}
      </div>
    );
  }

  return (
    <DashboardLayout title={mode === 'conexao' ? "Finalizar Cadastro" : mode === 'boas-vindas' ? "Cadastro Inicial" : "Ficha de Cadastro"}>
      {formContent}
    </DashboardLayout>
  );
}
