// Build sem dependências de runtime: tsc gera as declarações e compila os testes; esbuild gera ESM e CommonJS.
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

rmSync('./dist', { recursive: true, force: true });
rmSync('./dist-test', { recursive: true, force: true });
execSync('npx tsc -p tsconfig.build.json --emitDeclarationOnly', { stdio: 'inherit' });
for (const [format, outfile] of [['esm', './dist/index.js'], ['cjs', './dist/index.cjs']]) {
  await build({ entryPoints: ['./src/index.ts'], outfile, bundle: true, format, target: 'es2022', platform: 'neutral', sourcemap: true });
}
execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
