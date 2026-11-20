// Entry point for the make.fun submission. Node 22, standard library only.
// The guide itself is the plain static app/ tree; this script packages it and writes the
// dossier the judge reads. MAKEFUN_OUTPUT_DIR substitutes for /output outside the grader.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotDir = join(here, 'screenshots');

if (!statSync(join(appDir, 'index.html')).isFile()) throw new Error('app/index.html is missing');
if (!existsSync(shotDir)) throw new Error('screenshots/ is missing');

const shots = readdirSync(shotDir).filter((name) => /\.(png|jpe?g)$/i.test(name));
if (shots.length < 3 || shots.length > 4) throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);

mkdirSync(output, { recursive: true });
cpSync(appDir, join(output, 'app'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
cpSync(shotDir, join(output, 'screenshots'), { recursive: true });

const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(output, 'dossier.json'), dossier);
console.log(`Packaged ${shots.length} screenshots and app/ into ${output}/dossier.json`);
