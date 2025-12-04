// Build script to embed frontend HTML into TypeScript
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const htmlPath = join(import.meta.dir, '../frontend/dist/index.html');
const outputPath = join(import.meta.dir, '../src/frontend-html.generated.ts');

console.log('📦 Reading built frontend from:', htmlPath);
const html = readFileSync(htmlPath, 'utf-8');

// Use JSON.stringify to properly escape the string instead of manual escaping
const output = `// Auto-generated file - do not edit manually
// Run \`bun run build:frontend\` to regenerate
export const frontendHTML = ${JSON.stringify(html)};
`;

writeFileSync(outputPath, output, 'utf-8');
console.log('✅ Generated frontend-html.generated.ts');
console.log(`📏 HTML size: ${html.length} bytes`);
