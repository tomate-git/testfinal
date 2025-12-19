export enum UserRole {
    ADMIN = 'ADMIN',
    ACCUEIL = 'ACCUEIL',
    USER = 'USER',
}

export enum UserType {
    INDIVIDUAL = 'INDIVIDUAL',
    COMPANY = 'COMPANY',
}

export interface User {
    id: string;
    email: string;
    password?: string; // Stored for mock auth purposes
    role: UserRole;
    type: UserType;

    // Personal Info
    firstName?: string;
    lastName?: string;
    phone?: string;

    // Company Info
    companyName?: string;
    siret?: string;
}
