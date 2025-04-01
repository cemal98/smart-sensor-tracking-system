export interface Company {
    id: string;
    name: string;
    description?: string;
    code: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CompaniesState {
    list: Company[];
    loading: boolean;
    error: string | null;
}
