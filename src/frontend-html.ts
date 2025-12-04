// This file exports the built frontend HTML
// Run `cd frontend && bun run build` to rebuild
import { readFileSync } from 'fs';
import { join } from 'path';

export const frontendHTML = readFileSync(
    join(import.meta.dir, '../frontend/dist/index.html'),
    'utf-8'
);
