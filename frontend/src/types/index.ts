export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface Group {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    created_at: number;
}

export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'admin' | 'member';
    email: string;
    full_name: string | null;
    avatar_url: string | null;
}

export interface RepositoryPermission {
    type: 'user' | 'group';
    targetId: string;
    permission: 'read' | 'write' | 'owner';
    targetName?: string; // For display
}
