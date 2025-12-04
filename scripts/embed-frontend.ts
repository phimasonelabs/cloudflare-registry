// Build script to embed frontend HTML into TypeScript
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const htmlPath = join(import.meta.dir, '../frontend/dist/index.html');
const outputPath = join(import.meta.dir, '../src/frontend-html.generated.ts');

console.log('📦 Reading built frontend from:', htmlPath);
const html = readFileSync(htmlPath, 'utf-8');

const output = `// Auto-generated file - do not edit manually
// Run \`bun run build:frontend\` to regenerate
export const frontendHTML = \`${html.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;

writeFileSync(outputPath, output, 'utf-8');
console.log('✅ Generated frontend-html.generated.ts');
