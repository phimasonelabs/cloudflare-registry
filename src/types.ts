// TypeScript types for the application

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    oauth_provider: 'google' | 'github';
    oauth_id: string;
    created_at: number;
    updated_at: number;
}

export interface Session {
    id: string;
    user_id: string;
    token: string;
    expires_at: number;
    created_at: number;
}

export interface Group {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    created_at: number;
    updated_at: number;
}

export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'admin' | 'member';
    added_at: number;
}

export interface Repository {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    owner_id: string;
    created_at: number;
    updated_at: number;
    last_pushed_at: number | null;
}

export type Permission = 'owner' | 'write' | 'read';

export interface UserPermission {
    id: string;
    repository_id: string;
    user_id: string;
    permission: Permission;
    granted_at: number;
    granted_by: string;
}

export interface GroupPermission {
    id: string;
    repository_id: string;
    group_id: string;
    permission: 'write' | 'read';
    granted_at: number;
    granted_by: string;
}

// Environment bindings
export interface Env {
    REGISTRY_BUCKET: R2Bucket;
    DB: D1Database;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    JWT_SECRET: string;
}

// Auth context passed through middleware
export interface AuthContext {
    user: User;
    sessionId: string;
}

// OAuth user profile
export interface OAuthUserProfile {
    email: string;
    name: string | null;
    avatar: string | null;
    provider: 'google' | 'github';
    providerId: string;
}

// Personal Access Token
export type PatScope = 'registry:read' | 'registry:write' | 'registry:admin';

export interface PersonalAccessToken {
    id: string;
    user_id: string;
    name: string;
    token_hash: string;
    scopes: PatScope[];
    last_used_at: number | null;
    expires_at: number | null;
    created_at: number;
}

