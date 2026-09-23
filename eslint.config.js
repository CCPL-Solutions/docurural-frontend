// @ts-check
// Configuración de ESLint (angular-eslint 21). Es el mecanismo de verificación automática de las
// reglas del proyecto (docs/constitucion-borrador.md). Cada regla en 'warn' indica la fase de
// docs/plan-remediacion.md que la corrige y la pasa a 'error'.
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const FEATURES = ['auth', 'categories', 'dashboard', 'documents', 'users'];

// Se comparten con el bloque por feature: en flat config, un bloque posterior reemplaza la
// configuración completa de la regla, no la fusiona.
const RESTRICTED_IMPORT_PATHS = [
  {
    // TODO(Fase 2): 'error' — CMP-06 (D6).
    name: '@angular/common',
    importNames: ['NgClass'],
    message: 'CMP-06: usa [class] o [class.x] en lugar de NgClass.',
  },
  {
    // TODO(Fase 5): 'error' — FRM-05 (D25).
    name: '@angular/forms',
    importNames: ['FormsModule'],
    message: 'FRM-05: enlaza campos sueltos con (input) + signal; no uses ngModel.',
  },
];

/**
 * ARQ-02: una feature no importa internals de otra. Solo se permite la superficie pública
 * `features/<feature>/dialogs/`. Cubre imports relativos y el alias `@features/` (Fase 2).
 * @param {string} feature
 */
function crossFeatureImportsRule(feature) {
  const others = FEATURES.filter((f) => f !== feature).join('|');
  return {
    files: [`src/app/features/${feature}/**/*.ts`],
    rules: {
      // TODO(Fase 3): pasar a 'error' al mover las piezas compartidas a shared/ (D11).
      'no-restricted-imports': [
        'warn',
        {
          paths: RESTRICTED_IMPORT_PATHS,
          patterns: [
            {
              regex: `^(?:(?:\\.\\./)+|@features/)(?:${others})/(?!dialogs/)`,
              message:
                'ARQ-02: no importes internals de otra feature. Usa shared/ o features/<feature>/dialogs/.',
            },
          ],
        },
      ],
    },
  };
}

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // ── Ya se cumplen: 'error' ────────────────────────────────────────────
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
      // EST-02: takeUntilDestroyed fuera de contexto de inyección debe recibir DestroyRef.
      '@angular-eslint/no-implicit-take-until-destroyed': 'error',
      // Callbacks vacíos por defecto (ControlValueAccessor) y `.catch(() => {})` deliberados.
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],

      // ── Pendientes de remediación: 'warn' ─────────────────────────────────
      // TODO(Fase 2): 'error' — CMP-03 (D2).
      '@angular-eslint/no-output-native': 'warn',
      // TODO(Fase 2): 'error' — CMP-02 (D1).
      '@angular-eslint/prefer-signals': 'warn',
      '@angular-eslint/prefer-output-emitter-ref': 'warn',
      // TODO(Fase 7): 'error' — CMP-01 (D3).
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      'no-restricted-imports': ['warn', { paths: RESTRICTED_IMPORT_PATHS }],
      'no-restricted-syntax': [
        'warn',
        {
          // TODO(Fase 2): 'error' — CMP-07 (D7).
          selector: "Decorator[expression.callee.name='Component'] Property[key.name='styles']",
          message: 'CMP-07: usa styleUrl; no declares estilos inline.',
        },
      ],
    },
  },
  ...FEATURES.map(crossFeatureImportsRule),
  {
    // Único punto donde no hay otro canal para reportar un fallo de arranque.
    files: ['src/main.ts'],
    rules: { 'no-console': ['error', { allow: ['error'] }] },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // ── Ya se cumplen: 'error' ────────────────────────────────────────────
      '@angular-eslint/template/prefer-control-flow': 'error',

      // ── Pendientes de remediación: 'warn' ─────────────────────────────────
      // TODO(Fase 2): 'error' — CMP-06 (D6).
      '@angular-eslint/template/prefer-class-binding': 'warn',
      // TODO(Fase 2): 'error' — UI-10 (Q5): <label> sin control → <span> con id + aria-labelledby.
      '@angular-eslint/template/label-has-associated-control': 'warn',
      // Fase 8 (CAL-02): activar '@angular-eslint/template/i18n' al adoptar @angular/localize.
    },
  },
]);
