import { Database } from "../integrations/supabase/types";

export type Person = Database['public']['Tables']['people']['Row'];
export type Ministry = Database['public']['Tables']['ministries']['Row'];
export type Accompaniment = Database['public']['Tables']['accompaniments']['Row'];

export type PersonType = 'membro' | 'visitante' | 'convertido';
