// Verifica las reglas de estilos del proyecto que ESLint no cubre (docs/constitucion-borrador.md,
// §7: UI-01, UI-03, UI-05, UI-09). Sin dependencias: recorre src/ y cuenta literales prohibidos.
//
// Uso: node scripts/check-styles.mjs [--verbose]
// Una categoría con `strict: true` hace fallar el proceso (y la CI) si tiene hallazgos. Desde la
// Fase 4 de docs/plan-remediacion.md todas son estrictas.
//
// Excepciones de UI-09 (no se cuentan):
// - `0` en cualquier propiedad y `1px` en padding/margin/gap (líneas finas y ajustes ópticos).
// - Tamaños de icono: son intrínsecos y se escriben con el mixin `icon.size(Npx)` de
//   src/styles/_icons.scss, que no es una declaración `font-size` en el componente.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose');

/**
 * @typedef {{ file: string; line: number; text: string }} Finding
 * @typedef {{ id: string; description: string; strict: boolean; files: (path: string) => boolean; pattern: RegExp }} Check
 */

/** @type {Check[]} */
const CHECKS = [
  {
    id: 'UI-01 hex-scss',
    description: 'Colores hex en SCSS de componente (usar var(--color-*))',
    strict: true,
    files: (p) => p.startsWith('src/app/') && p.endsWith('.scss'),
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
  },
  {
    id: 'UI-01 hex-ts',
    description: 'Colores hex en TypeScript (usar var(--color-*); chart.js lee los tokens del DOM)',
    strict: true,
    files: (p) => p.startsWith('src/app/') && p.endsWith('.ts') && !p.endsWith('.spec.ts'),
    pattern: /['"`]#[0-9a-fA-F]{3,8}['"`]/g,
  },
  {
    id: 'UI-03 raw-media',
    description: '@media escritas a mano (usar @include bp.lg/md/sm)',
    strict: true,
    files: (p) =>
      p.startsWith('src/') && p.endsWith('.scss') && !p.endsWith('styles/_breakpoints.scss'),
    pattern: /@media\s*\(/g,
  },
  {
    id: 'UI-03 window-width',
    description: 'window.innerWidth en TypeScript (usar BreakpointObserver)',
    strict: true,
    files: (p) => p.startsWith('src/app/') && p.endsWith('.ts'),
    pattern: /window\.innerWidth/g,
  },
  {
    id: 'UI-05 raw-btn-class',
    description: 'class="btn…" fuera de <app-button> (usar el componente)',
    strict: true,
    files: (p) =>
      p.startsWith('src/app/') &&
      (p.endsWith('.html') || p.endsWith('.ts')) &&
      !p.startsWith('src/app/shared/components/button/'),
    pattern: /class="btn[\s"]/g,
  },
  {
    id: 'UI-09 font-size-px',
    description: 'font-size en px (usar var(--text-*))',
    strict: true,
    files: (p) => p.startsWith('src/app/') && p.endsWith('.scss'),
    pattern: /^\s*font-size\s*:[^;]*\b\d+px/gm,
  },
  {
    id: 'UI-09 spacing-px',
    description: 'padding/margin/gap en px (usar var(--space-*))',
    strict: true,
    files: (p) => p.startsWith('src/app/') && p.endsWith('.scss'),
    // Cualquier px distinto de 0 y 1.
    pattern:
      /^\s*(?:padding|margin|gap|row-gap|column-gap)[a-z-]*\s*:[^;]*(?<![\d.])(?:[2-9]|[1-9]\d+)px/gm,
  },
  {
    id: 'UI-09 radius-px',
    description: 'border-radius literal (usar var(--radius-*))',
    strict: true,
    files: (p) => p.startsWith('src/app/') && p.endsWith('.scss'),
    // Cualquier literal distinto de 0 (px o %).
    pattern: /^\s*border-[a-z-]*radius\s*:[^;]*(?<![\d.-])[1-9]\d*(?:\.\d+)?(?:px|%)/gm,
  },
];

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(join(ROOT, 'src')).map((f) => relative(ROOT, f).split(sep).join('/'));

let failed = false;
for (const check of CHECKS) {
  /** @type {Finding[]} */
  const findings = [];
  for (const file of files.filter(check.files)) {
    const content = readFileSync(join(ROOT, file), 'utf8');
    for (const match of content.matchAll(check.pattern)) {
      const line = content.slice(0, match.index).split('\n').length;
      findings.push({ file, line, text: match[0].trim() });
    }
  }
  const fileCount = new Set(findings.map((f) => f.file)).size;
  const status = findings.length === 0 ? 'OK ' : check.strict ? 'ERR' : 'INF';
  console.log(
    `[${status}] ${check.id.padEnd(20)} ${String(findings.length).padStart(4)} en ${fileCount} archivos — ${check.description}`,
  );
  if (VERBOSE) for (const f of findings) console.log(`        ${f.file}:${f.line}  ${f.text}`);
  if (check.strict && findings.length > 0) failed = true;
}

process.exit(failed ? 1 : 0);
