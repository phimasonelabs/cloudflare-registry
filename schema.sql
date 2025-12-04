-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    oauth_provider TEXT NOT NULL, -- 'google' or 'github'
    oauth_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(oauth_provider, oauth_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_groups_created_by ON groups(created_by);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member', -- 'admin' or 'member'
    added_at INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    owner_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_pushed_at INTEGER,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_repositories_name ON repositories(name);
CREATE INDEX idx_repositories_owner ON repositories(owner_id);
CREATE INDEX idx_repositories_public ON repositories(is_public);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    repository_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    permission TEXT NOT NULL, -- 'owner', 'write', 'read'
    granted_at INTEGER NOT NULL,
    granted_by TEXT NOT NULL,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(repository_id, user_id)
);

CREATE INDEX idx_user_permissions_repo ON user_permissions(repository_id);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- Group permissions table
CREATE TABLE IF NOT EXISTS group_permissions (
    id TEXT PRIMARY KEY,
    repository_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    permission TEXT NOT NULL, -- 'write' or 'read' (no owner for groups)
    granted_at INTEGER NOT NULL,
    granted_by TEXT NOT NULL,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(repository_id, group_id)
);

CREATE INDEX idx_group_permissions_repo ON group_permissions(repository_id);
CREATE INDEX idx_group_permissions_group ON group_permissions(group_id);
