// JWT token management using Web Crypto API

interface JWTPayload {
    sub: string; // User ID
    email: string;
    iat: number; // Issued at
    exp: number; // Expires at
}

export class JWT {
    constructor(private secret: string) { }

    async sign(userId: string, email: string, expiresIn: number = 30 * 24 * 60 * 60): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        const payload: JWTPayload = {
            sub: userId,
            email,
            iat: now,
            exp: now + expiresIn
        };

        const header = { alg: 'HS256', typ: 'JWT' };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

        const signature = await this.signData(`${encodedHeader}.${encodedPayload}`);

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    async verify(token: string): Promise<JWTPayload | null> {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const [encodedHeader, encodedPayload, signature] = parts;

            // Verify signature
            const expectedSignature = await this.signData(`${encodedHeader}.${encodedPayload}`);
            if (signature !== expectedSignature) return null;

            // Decode payload
            const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JWTPayload;

            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) return null;

            return payload;
        } catch (error) {
            return null;
        }
    }

    private async signData(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(this.secret);
        const dataBuffer = encoder.encode(data);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
        return this.base64UrlEncode(new Uint8Array(signature));
    }

    private base64UrlEncode(data: string | Uint8Array): string {
        let base64: string;

        if (typeof data === 'string') {
            base64 = btoa(data);
        } else {
            // Convert Uint8Array to string
            const binary = Array.from(data).map(byte => String.fromCharCode(byte)).join('');
            base64 = btoa(binary);
        }

        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    private base64UrlDecode(data: string): string {
        let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) base64 += '='.repeat(4 - pad);
        return atob(base64);
    }
}
