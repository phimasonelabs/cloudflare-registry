import { OAuthUserProfile } from '../types';

export interface OAuthProvider {
    name: 'google' | 'github';
    getAuthUrl(state: string, redirectUri: string): string;
    getUserProfile(code: string, redirectUri: string): Promise<OAuthUserProfile>;
}

// Google OAuth Provider
export class GoogleOAuthProvider implements OAuthProvider {
    name = 'google' as const;

    constructor(
        private clientId: string,
        private clientSecret: string
    ) { }

    getAuthUrl(state: string, redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            access_type: 'online',
            prompt: 'select_account'
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }

    async getUserProfile(code: string, redirectUri: string): Promise<OAuthUserProfile> {
        // Exchange code for token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json() as any;
        const accessToken = tokenData.access_token;

        // Get user profile
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to get user profile');
        }

        const profile = await profileResponse.json() as any;

        return {
            email: profile.email,
            name: profile.name || null,
            avatar: profile.picture || null,
            provider: 'google',
            providerId: profile.id
        };
    }
}

// GitHub OAuth Provider
export class GitHubOAuthProvider implements OAuthProvider {
    name = 'github' as const;

    constructor(
        private clientId: string,
        private clientSecret: string
    ) { }

    getAuthUrl(state: string, redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: redirectUri,
            scope: 'user:email',
            state,
            allow_signup: 'true'
        });
        return `https://github.com/login/oauth/authorize?${params}`;
    }

    async getUserProfile(code: string, redirectUri: string): Promise<OAuthUserProfile> {
        // Exchange code for token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code,
                redirect_uri: redirectUri
            })
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json() as any;
        const accessToken = tokenData.access_token;

        // Get user profile
        const profileResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': 'CloudflareRegistry'
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to get user profile');
        }

        const profile = await profileResponse.json() as any;

        // GitHub might not expose email in profile, fetch separately
        let email = profile.email;
        if (!email) {
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'User-Agent': 'CloudflareRegistry'
                }
            });

            if (emailsResponse.ok) {
                const emails = await emailsResponse.json() as any[];
                const primaryEmail = emails.find(e => e.primary) || emails[0];
                email = primaryEmail?.email;
            }
        }

        if (!email) {
            throw new Error('Failed to get user email from GitHub');
        }

        return {
            email,
            name: profile.name || null,
            avatar: profile.avatar_url || null,
            provider: 'github',
            providerId: String(profile.id)
        };
    }
}
