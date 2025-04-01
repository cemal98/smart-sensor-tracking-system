export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string;
    company?: {
        name: string
    }
}

export interface UserState {
    list: User[];
    loading: boolean;
    error: string | null;
}

export enum UserRole {
    SYSTEM_ADMIN = 'system_admin',
    COMPANY_ADMIN = 'company_admin',
    USER = 'user',
}