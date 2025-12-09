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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accompaniments: {
        Row: {
          created_at: string | null
          id: string
          last_contact_date: string | null
          observacoes: string | null
          person_id: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          observacoes?: string | null
          person_id?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          observacoes?: string | null
          person_id?: string | null
          status?: string
          type?: string
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
      ministries: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          leader: string | null
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          leader?: string | null
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          leader?: string | null
          name?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          address: string | null
          baptism_date: string | null
          baptized_spirit: boolean | null
          baptized_water: boolean | null
          birth_date: string | null
          civil_status: string | null
          conversion_date: string | null
          convert_needs: string | null
          convert_wants_accompaniment: boolean | null
          created_at: string | null
          email: string | null
          full_name: string
          gender: string | null
          has_ministry: boolean | null
          how_met: string | null
          id: string
          integration_date: string | null
          member_has_served: boolean | null
          member_prev_ministry: string | null
          ministries: string[] | null
          natural_skills: string | null
          phone: string
          spiritual_gifts: string | null
          spouse_name: string | null
          type: string
          visitor_first_time: boolean | null
          visitor_wants_contact: boolean | null
          visitor_wants_discipleship: boolean | null
        }
        Insert: {
          address?: string | null
          baptism_date?: string | null
          baptized_spirit?: boolean | null
          baptized_water?: boolean | null
          birth_date?: string | null
          civil_status?: string | null
          conversion_date?: string | null
          convert_needs?: string | null
          convert_wants_accompaniment?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          has_ministry?: boolean | null
          how_met?: string | null
          id?: string
          integration_date?: string | null
          member_has_served?: boolean | null
          member_prev_ministry?: string | null
          ministries?: string[] | null
          natural_skills?: string | null
          phone: string
          spiritual_gifts?: string | null
          spouse_name?: string | null
          type: string
          visitor_first_time?: boolean | null
          visitor_wants_contact?: boolean | null
          visitor_wants_discipleship?: boolean | null
        }
        Update: {
          address?: string | null
          baptism_date?: string | null
          baptized_spirit?: boolean | null
          baptized_water?: boolean | null
          birth_date?: string | null
          civil_status?: string | null
          conversion_date?: string | null
          convert_needs?: string | null
          convert_wants_accompaniment?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          has_ministry?: boolean | null
          how_met?: string | null
          id?: string
          integration_date?: string | null
          member_has_served?: boolean | null
          member_prev_ministry?: string | null
          ministries?: string[] | null
          natural_skills?: string | null
          phone?: string
          spiritual_gifts?: string | null
          spouse_name?: string | null
          type?: string
          visitor_first_time?: boolean | null
          visitor_wants_contact?: boolean | null
          visitor_wants_discipleship?: boolean | null
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
