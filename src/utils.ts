import { Context } from 'hono';

export interface OCIError {
    code: string;
    message: string;
    detail?: any;
}

export class RegistryError extends Error {
    constructor(public code: string, message: string, public status: number = 400, public detail?: any) {
        super(message);
    }
}

export const formatError = (code: string, message: string, detail?: any) => ({
    errors: [
        {
            code,
            message,
            detail
        }
    ]
});
