export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accompaniments: {
        Row: {
          contact_date: string | null
          created_at: string | null
          feedback: string | null
          id: string
          leader_name: string | null
          person_id: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          contact_date?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          leader_name?: string | null
          person_id?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          contact_date?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          leader_name?: string | null
          person_id?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accompaniments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          matricula: string
          user_email: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          matricula: string
          user_email?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          matricula?: string
          user_email?: string | null
          user_name?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          age: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          age?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          age?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          best_moment: string | null
          created_at: string
          id: string
          improvements: string | null
          phrase_completion: string | null
          rating_general: number
          rating_lecture: number | null
          team_energy: string | null
          user_name: string | null
        }
        Insert: {
          best_moment?: string | null
          created_at?: string
          id?: string
          improvements?: string | null
          phrase_completion?: string | null
          rating_general: number
          rating_lecture?: number | null
          team_energy?: string | null
          user_name?: string | null
        }
        Update: {
          best_moment?: string | null
          created_at?: string
          id?: string
          improvements?: string | null
          phrase_completion?: string | null
          rating_general?: number
          rating_lecture?: number | null
          team_energy?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      flowrev_anexos: {
        Row: {
          created_at: string
          id: string
          insumo_id: string
          legenda: string | null
          nome_arquivo: string
          tamanho_bytes: number | null
          tipo: string
          uploaded_por: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          insumo_id: string
          legenda?: string | null
          nome_arquivo: string
          tamanho_bytes?: number | null
          tipo: string
          uploaded_por?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          insumo_id?: string
          legenda?: string | null
          nome_arquivo?: string
          tamanho_bytes?: number | null
          tipo?: string
          uploaded_por?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "flowrev_anexos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "flowrev_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      flowrev_edicoes: {
        Row: {
          ano: number
          created_at: string
          data_entrega_prevista: string | null
          fase_atual: string | null
          id: string
          mes: number
          percentual_conclusao: number | null
          produto_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          data_entrega_prevista?: string | null
          fase_atual?: string | null
          id?: string
          mes: number
          percentual_conclusao?: number | null
          produto_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          data_entrega_prevista?: string | null
          fase_atual?: string | null
          id?: string
          mes?: number
          percentual_conclusao?: number | null
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flowrev_edicoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "flowrev_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      flowrev_feedback: {
        Row: {
          category: string | null
          comment: string | null
          created_at: string | null
          id: string
          respondent_name: string | null
          role: string | null
          score: number | null
          sentiment: string | null
          tags: string[] | null
          type: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          respondent_name?: string | null
          role?: string | null
          score?: number | null
          sentiment?: string | null
          tags?: string[] | null
          type: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          respondent_name?: string | null
          role?: string | null
          score?: number | null
          sentiment?: string | null
          tags?: string[] | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      flowrev_insumo_responsaveis: {
        Row: {
          id: string
          insumo_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          insumo_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          insumo_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flowrev_insumo_responsaveis_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "flowrev_insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flowrev_insumo_responsaveis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "flowrev_users"
            referencedColumns: ["id"]
          },
        ]
      }
      flowrev_insumo_tags: {
        Row: {
          id: string
          insumo_id: string | null
          tag_id: string | null
        }
        Insert: {
          id?: string
          insumo_id?: string | null
          tag_id?: string | null
        }
        Update: {
          id?: string
          insumo_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flowrev_insumo_tags_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "flowrev_insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flowrev_insumo_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "flowrev_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      flowrev_insumos: {
        Row: {
          checklist: Json | null
          conteudo_texto: string | null
          created_at: string
          data_limite: string | null
          edicao_id: string
          enviado_em: string | null
          id: string
          motivo_ajuste: string | null
          observacoes: string | null
          status: string | null
          tipo_insumo_id: string
          titulo: string | null
        }
        Insert: {
          checklist?: Json | null
          conteudo_texto?: string | null
          created_at?: string
          data_limite?: string | null
          edicao_id: string
          enviado_em?: string | null
          id?: string
          motivo_ajuste?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_insumo_id: string
          titulo?: string | null
        }
        Update: {
          checklist?: Json | null
          conteudo_texto?: string | null
          created_at?: string
          data_limite?: string | null
          edicao_id?: string
          enviado_em?: string | null
          id?: string
          motivo_ajuste?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_insumo_id?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flowrev_insumos_edicao_id_fkey"
            columns: ["edicao_id"]
            isOneToOne: false
            referencedRelation: "flowrev_edicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flowrev_insumos_tipo_insumo_id_fkey"
            columns: ["tipo_insumo_id"]
            isOneToOne: false
            referencedRelation: "flowrev_tipos_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      flowrev_produtos: {
        Row: {
          ativo: boolean | null
          cor_tema: string | null
          created_at: string
          id: string
          logo_url: string | null
          nome: string
          ordem: number | null
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          cor_tema?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome: string
          ordem?: number | null
          slug: string
        }
        Update: {
          ativo?: boolean | null
          cor_tema?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome?: string
          ordem?: number | null
          slug?: string
        }
        Relationships: []
      }
      flowrev_tags: {
        Row: {
          cor: string
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          cor: string
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      flowrev_tipos_insumos: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          requer_imagem: boolean | null
          requer_legenda: boolean | null
          requer_pdf: boolean | null
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          requer_imagem?: boolean | null
          requer_legenda?: boolean | null
          requer_pdf?: boolean | null
          slug: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          requer_imagem?: boolean | null
          requer_legenda?: boolean | null
          requer_pdf?: boolean | null
          slug?: string
        }
        Relationships: []
      }
      flowrev_users: {
        Row: {
          created_at: string
          email: string
          id: string
          matricula: string | null
          nome: string
          produtos_acesso: string[] | null
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          matricula?: string | null
          nome: string
          produtos_acesso?: string[] | null
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          matricula?: string | null
          nome?: string
          produtos_acesso?: string[] | null
          role?: string
        }
        Relationships: []
      }
      interview_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          interviewee_company: string | null
          interviewee_email: string | null
          interviewee_name: string
          interviewee_phone: string | null
          interviewee_role: string | null
          is_highlighted: boolean | null
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          interviewee_company?: string | null
          interviewee_email?: string | null
          interviewee_name: string
          interviewee_phone?: string | null
          interviewee_role?: string | null
          is_highlighted?: boolean | null
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          interviewee_company?: string | null
          interviewee_email?: string | null
          interviewee_name?: string
          interviewee_phone?: string | null
          interviewee_role?: string | null
          is_highlighted?: boolean | null
        }
        Relationships: []
      }
      kids_checkins: {
        Row: {
          checkin_time: string | null
          checkout_time: string | null
          child_id: string
          created_at: string | null
          id: string
          observations: string | null
          responsible_id: string
          security_code: string
          status: string | null
        }
        Insert: {
          checkin_time?: string | null
          checkout_time?: string | null
          child_id: string
          created_at?: string | null
          id?: string
          observations?: string | null
          responsible_id: string
          security_code: string
          status?: string | null
        }
        Update: {
          checkin_time?: string | null
          checkout_time?: string | null
          child_id?: string
          created_at?: string | null
          id?: string
          observations?: string | null
          responsible_id?: string
          security_code?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_checkins_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_checkins_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          address: string | null
          baptism_date: string | null
          baptized_spirit: boolean | null
          baptized_water: boolean | null
          birth_date: string | null
          cell_name: string | null
          civil_status: string | null
          conversion_date: string | null
          convert_needs: string | null
          convert_wants_accompaniment: boolean | null
          cpf: string | null
          created_at: string | null
          email: string | null
          family_id: string | null
          full_name: string | null
          gender: string | null
          has_cell: boolean | null
          has_ministry: boolean | null
          how_met: string | null
          id: string
          integration_date: string | null
          invited_by: string | null
          member_has_served: boolean | null
          member_prev_ministry: string | null
          ministries: string[] | null
          name: string
          natural_skills: string | null
          observations: string | null
          phone: string
          spiritual_gifts: string | null
          spouse_name: string | null
          type: string
          visitor_first_time: boolean | null
          visitor_prayer_request: string | null
          visitor_religion: string | null
          visitor_wants_contact: boolean | null
          visitor_wants_discipleship: boolean | null
          journey_stage: string | null
          accepted_jesus: boolean | null
          avatar_url: string | null
          member_role: string | null
          leader_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          baptism_date?: string | null
          baptized_spirit?: boolean | null
          baptized_water?: boolean | null
          birth_date?: string | null
          cell_name?: string | null
          civil_status?: string | null
          conversion_date?: string | null
          convert_needs?: string | null
          convert_wants_accompaniment?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          gender?: string | null
          has_cell?: boolean | null
          has_ministry?: boolean | null
          how_met?: string | null
          id?: string
          integration_date?: string | null
          invited_by?: string | null
          member_has_served?: boolean | null
          member_prev_ministry?: string | null
          ministries?: string[] | null
          name: string
          natural_skills?: string | null
          observations?: string | null
          phone: string
          spiritual_gifts?: string | null
          spouse_name?: string | null
          type: string
          visitor_first_time?: boolean | null
          visitor_prayer_request?: string | null
          visitor_religion?: string | null
          visitor_wants_contact?: boolean | null
          visitor_wants_discipleship?: boolean | null
          journey_stage?: string | null
          accepted_jesus?: boolean | null
          avatar_url?: string | null
          member_role?: string | null
          leader_id?: string | null
        }
        Update: {
          address?: string | null
          baptism_date?: string | null
          baptized_spirit?: boolean | null
          baptized_water?: boolean | null
          birth_date?: string | null
          cell_name?: string | null
          civil_status?: string | null
          conversion_date?: string | null
          convert_needs?: string | null
          convert_wants_accompaniment?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          family_id?: string | null
          full_name?: string | null
          gender?: string | null
          has_cell?: boolean | null
          has_ministry?: boolean | null
          how_met?: string | null
          id?: string
          integration_date?: string | null
          invited_by?: string | null
          member_has_served?: boolean | null
          member_prev_ministry?: string | null
          ministries?: string[] | null
          name?: string
          natural_skills?: string | null
          observations?: string | null
          phone?: string
          spiritual_gifts?: string | null
          spouse_name?: string | null
          type?: string
          visitor_first_time?: boolean | null
          visitor_prayer_request?: string | null
          visitor_religion?: string | null
          visitor_wants_contact?: boolean | null
          visitor_wants_discipleship?: boolean | null
          journey_stage?: string | null
          accepted_jesus?: boolean | null
          avatar_url?: string | null
          member_role?: string | null
          leader_id?: string | null
        }
        Relationships: []
      }
      word_cloud: {
        Row: {
          approved: boolean | null
          created_at: string
          id: string
          text: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
