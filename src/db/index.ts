import { D1Database } from '@cloudflare/workers-types';
import { User, Session, Group, GroupMember, Repository, UserPermission, GroupPermission, Permission, PersonalAccessToken, PatScope } from '../types';

export class Database {
    constructor(private db: D1Database) { }

    // ============ Users ============
    async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
        const id = crypto.randomUUID();
        const now = Date.now();

        await this.db.prepare(`
      INSERT INTO users (id, email, full_name, avatar_url, oauth_provider, oauth_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, user.email, user.full_name, user.avatar_url, user.oauth_provider, user.oauth_id, now, now).run();

        return { ...user, id, created_at: now, updated_at: now };
    }

    async getUserById(id: string): Promise<User | null> {
        const result = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
        return result as User | null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const result = await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        return result as User | null;
    }

    async getUserByOAuth(provider: string, oauthId: string): Promise<User | null> {
        const result = await this.db.prepare(
            'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
        ).bind(provider, oauthId).first();
        return result as User | null;
    }

    // ============ Sessions ============
    async createSession(userId: string, token: string, expiresAt: number): Promise<Session> {
        const id = crypto.randomUUID();
        const now = Date.now();

        await this.db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, userId, token, expiresAt, now).run();

        return { id, user_id: userId, token, expires_at: expiresAt, created_at: now };
    }

    async getSessionByToken(token: string): Promise<Session | null> {
        const result = await this.db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?')
            .bind(token, Date.now()).first();
        return result as Session | null;
    }

    async deleteSession(token: string): Promise<void> {
        await this.db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }

    async deleteExpiredSessions(): Promise<void> {
        await this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(Date.now()).run();
    }

    // ============ Groups ============
    async createGroup(name: string, description: string | null, createdBy: string): Promise<Group> {
        const id = crypto.randomUUID();
        const now = Date.now();

        await this.db.prepare(`
      INSERT INTO groups (id, name, description, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, name, description, createdBy, now, now).run();

        // Auto-add creator as admin
        await this.addGroupMember(id, createdBy, 'admin');

        return { id, name, description, created_by: createdBy, created_at: now, updated_at: now };
    }

    async getGroupById(id: string): Promise<Group | null> {
        const result = await this.db.prepare('SELECT * FROM groups WHERE id = ?').bind(id).first();
        return result as Group | null;
    }

    async getGroupsByUser(userId: string): Promise<Group[]> {
        const results = await this.db.prepare(`
      SELECT g.* FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `).bind(userId).all();
        return results.results as unknown as Group[];
    }

    async updateGroup(id: string, name: string, description: string | null): Promise<void> {
        await this.db.prepare(`
      UPDATE groups SET name = ?, description = ?, updated_at = ?
      WHERE id = ?
    `).bind(name, description, Date.now(), id).run();
    }

    async deleteGroup(id: string): Promise<void> {
        await this.db.prepare('DELETE FROM groups WHERE id = ?').bind(id).run();
    }

    // ============ Group Members ============
    async addGroupMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<void> {
        const id = crypto.randomUUID();
        await this.db.prepare(`
      INSERT OR REPLACE INTO group_members (id, group_id, user_id, role, added_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, groupId, userId, role, Date.now()).run();
    }

    async removeGroupMember(groupId: string, userId: string): Promise<void> {
        await this.db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?')
            .bind(groupId, userId).run();
    }

    async getGroupMembers(groupId: string): Promise<(GroupMember & User)[]> {
        const results = await this.db.prepare(`
      SELECT gm.*, u.email, u.full_name, u.avatar_url
      FROM group_members gm
      INNER JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
    `).bind(groupId).all();
        return results.results as any[];
    }

    async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
        const result = await this.db.prepare(
            'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?'
        ).bind(groupId, userId).first();
        return (result as any)?.role === 'admin';
    }

    // ============ Repositories ============
    async createRepository(name: string, ownerId: string, description?: string, isPublic = false): Promise<Repository> {
        const id = crypto.randomUUID();
        const now = Date.now();

        await this.db.prepare(`
      INSERT INTO repositories (id, name, description, is_public, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, description || null, isPublic ? 1 : 0, ownerId, now, now).run();

        // Grant owner permission
        await this.grantUserPermission(id, ownerId, 'owner', ownerId);

        return { id, name, description: description || null, is_public: isPublic, owner_id: ownerId, created_at: now, updated_at: now, last_pushed_at: null };
    }

    async getRepositoryByName(name: string): Promise<Repository | null> {
        const result = await this.db.prepare('SELECT * FROM repositories WHERE name = ?').bind(name).first();
        if (!result) return null;
        return { ...(result as any), is_public: Boolean((result as any).is_public) };
    }

    async updateRepositoryPushTime(name: string): Promise<void> {
        await this.db.prepare('UPDATE repositories SET last_pushed_at = ? WHERE name = ?')
            .bind(Date.now(), name).run();
    }

    async listRepositories(userId?: string): Promise<Repository[]> {
        if (!userId) {
            // Public repos only
            const results = await this.db.prepare('SELECT * FROM repositories WHERE is_public = 1').all();
            return results.results.map((r: any) => ({ ...r, is_public: Boolean(r.is_public) }));
        }

        // Repos user has access to
        const results = await this.db.prepare(`
      SELECT DISTINCT r.* FROM repositories r
      LEFT JOIN user_permissions up ON r.id = up.repository_id
      LEFT JOIN group_permissions gp ON r.id = gp.repository_id
      LEFT JOIN group_members gm ON gp.group_id = gm.group_id
      WHERE r.is_public = 1 OR up.user_id = ? OR gm.user_id = ?
    `).bind(userId, userId).all();

        return results.results.map((r: any) => ({ ...r, is_public: Boolean(r.is_public) }));
    }

    // ============ Permissions ============
    async grantUserPermission(repoId: string, userId: string, permission: Permission, grantedBy: string): Promise<void> {
        const id = crypto.randomUUID();
        await this.db.prepare(`
      INSERT OR REPLACE INTO user_permissions (id, repository_id, user_id, permission, granted_at, granted_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, repoId, userId, permission, Date.now(), grantedBy).run();
    }

    async grantGroupPermission(repoId: string, groupId: string, permission: 'read' | 'write', grantedBy: string): Promise<void> {
        const id = crypto.randomUUID();
        await this.db.prepare(`
      INSERT OR REPLACE INTO group_permissions (id, repository_id, group_id, permission, granted_at, granted_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, repoId, groupId, permission, Date.now(), grantedBy).run();
    }

    async revokeUserPermission(repoId: string, userId: string): Promise<void> {
        await this.db.prepare('DELETE FROM user_permissions WHERE repository_id = ? AND user_id = ?')
            .bind(repoId, userId).run();
    }

    async revokeGroupPermission(repoId: string, groupId: string): Promise<void> {
        await this.db.prepare('DELETE FROM group_permissions WHERE repository_id = ? AND group_id = ?')
            .bind(repoId, groupId).run();
    }

    async getUserPermission(repoName: string, userId: string): Promise<Permission | null> {
        const repo = await this.getRepositoryByName(repoName);
        if (!repo) return null;

        // Check individual user permission first
        const userPerm = await this.db.prepare(`
      SELECT permission FROM user_permissions WHERE repository_id = ? AND user_id = ?
    `).bind(repo.id, userId).first();

        if (userPerm) return (userPerm as any).permission;

        // Check group permissions
        const groupPerm = await this.db.prepare(`
      SELECT gp.permission FROM group_permissions gp
      INNER JOIN group_members gm ON gp.group_id = gm.group_id
      WHERE gp.repository_id = ? AND gm.user_id = ?
      ORDER BY CASE gp.permission WHEN 'write' THEN 1 WHEN 'read' THEN 2 END
      LIMIT 1
    `).bind(repo.id, userId).first();

        return groupPerm ? (groupPerm as any).permission : null;
    }

    async canRead(repoName: string, userId?: string): Promise<boolean> {
        const repo = await this.getRepositoryByName(repoName);
        if (!repo) return false;
        if (repo.is_public) return true;
        if (!userId) return false;

        const perm = await this.getUserPermission(repoName, userId);
        return perm !== null;
    }

    async canWrite(repoName: string, userId: string): Promise<boolean> {
        const perm = await this.getUserPermission(repoName, userId);
        return perm === 'owner' || perm === 'write';
    }

    // ============ Personal Access Tokens ============
    async createPAT(
        userId: string,
        name: string,
        scopes: PatScope[],
        expiresAt: number | null = null
    ): Promise<{ token: string; pat: PersonalAccessToken }> {
        const id = crypto.randomUUID();
        const now = Date.now();

        // Generate random token with prefix
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = 'cfr_' + Array.from(tokenBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Hash the token for storage
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await this.db.prepare(`
            INSERT INTO personal_access_tokens (id, user_id, name, token_hash, scopes, last_used_at, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, userId, name, tokenHash, JSON.stringify(scopes), null, expiresAt, now).run();

        return {
            token, // Return plaintext token (only time it's visible)
            pat: { id, user_id: userId, name, token_hash: tokenHash, scopes, last_used_at: null, expires_at: expiresAt, created_at: now }
        };
    }

    async validatePAT(token: string): Promise<{ user: User; scopes: PatScope[] } | null> {
        // Hash the provided token
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Find PAT by hash
        const pat = await this.db.prepare(`
            SELECT * FROM personal_access_tokens WHERE token_hash = ?
        `).bind(tokenHash).first() as PersonalAccessToken | null;

        if (!pat) return null;

        // Check expiration
        if (pat.expires_at && pat.expires_at < Date.now()) {
            return null;
        }

        // Get user
        const user = await this.getUserById(pat.user_id);
        if (!user) return null;

        // Update last_used_at
        await this.updatePATUsage(tokenHash);

        return { user, scopes: JSON.parse(pat.scopes as any) as PatScope[] };
    }

    async updatePATUsage(tokenHash: string): Promise<void> {
        await this.db.prepare(`
            UPDATE personal_access_tokens SET last_used_at = ? WHERE token_hash = ?
        `).bind(Date.now(), tokenHash).run();
    }

    async listUserPATs(userId: string): Promise<Omit<PersonalAccessToken, 'token_hash'>[]> {
        const results = await this.db.prepare(`
            SELECT id, user_id, name, scopes, last_used_at, expires_at, created_at
            FROM personal_access_tokens WHERE user_id = ?
            ORDER BY created_at DESC
        `).bind(userId).all();

        return results.results.map((r: any) => ({
            ...r,
            scopes: JSON.parse(r.scopes)
        }));
    }

    async revokePAT(id: string, userId: string): Promise<void> {
        await this.db.prepare(`
            DELETE FROM personal_access_tokens WHERE id = ? AND user_id = ?
        `).bind(id, userId).run();
    }
}
