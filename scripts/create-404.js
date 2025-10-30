import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const distIndex = join(process.cwd(), 'dist', 'index.html');
const dist404 = join(process.cwd(), 'dist', '404.html');

if (!existsSync(distIndex)) {
  console.error('Error: dist/index.html not found. Run build first.');
  process.exit(1);
}

copyFileSync(distIndex, dist404);
console.log('Created dist/404.html for SPA fallback');
