export type PersonType = 'membro' | 'visitante' | 'convertido';

export interface Person {
    id: string;
    created_at: string;
    type: PersonType;

    // Personal
    name: string;
    birth_date?: string;
    gender?: string;
    civil_status?: string;
    spouse_name?: string;

    // Contact
    phone: string;
    email?: string;
    address?: string;
    how_met?: string;

    // Spiritual
    baptized_water: boolean;
    baptism_date?: string;
    baptized_spirit: boolean;
    has_cell: boolean;
    cell_name?: string;
    natural_skills?: string;
    spiritual_gifts?: string;

    // Visitor Specific
    visitor_first_time: boolean;
    visitor_wants_contact: boolean;
    visitor_wants_discipleship: boolean;

    // Convert Specific
    conversion_date?: string;
    convert_wants_accompaniment: boolean;
    convert_needs?: string;

    // Member Specific
    integration_date?: string;
    member_has_served: boolean;
    member_prev_ministry?: string;
}

export interface Child {
    id: string;
    parent_id: string;
    name: string;
    age: string;
}

export interface Ministry {
    id: string;
    created_at: string;
    name: string;
    leader?: string;
    description?: string;
    active: boolean;
}

export interface Accompaniment {
    id: string;
    created_at: string;
    person_id: string;
    type: string;
    status: 'pendente' | 'em_andamento' | 'concluido';
    observacoes?: string;
    last_contact_date?: string;
    people?: Person; // Joined data
}
