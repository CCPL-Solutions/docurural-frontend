// @ts-check
// Configuración de ESLint (angular-eslint 21). Es el mecanismo de verificación automática de las
// reglas del proyecto (docs/constitucion-borrador.md). Cada regla en 'warn' indica la fase de
// docs/plan-remediacion.md que la corrige y la pasa a 'error'.
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const FEATURES = ['auth', 'categories', 'dashboard', 'documents', 'users'];

// Restricciones de imports ya cumplidas ('error'). Van en la versión de typescript-eslint de la
// regla para poder tener otra severidad que las pendientes: la severidad es por regla, no por ruta.
const ENFORCED_RESTRICTED_IMPORTS = {
  paths: [
    {
      name: '@angular/common',
      importNames: ['NgClass'],
      message: 'CMP-06: usa [class] o [class.x] en lugar de NgClass.',
    },
  ],
  patterns: [
    {
      regex: '^(?:\\.\\./){3,}',
      message:
        'ARQ-05: entre carpetas raíz usa los alias @core/, @shared/, @features/ o @env/; los relativos no pasan de ../../.',
    },
  ],
};

// Restricciones pendientes de remediación ('warn'). Se comparten con el bloque por feature: en
// flat config, un bloque posterior reemplaza la configuración completa de la regla, no la fusiona.
const RESTRICTED_IMPORT_PATHS = [
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
      // CMP-03 (D2).
      '@angular-eslint/no-output-native': 'error',
      // CMP-02 (D1).
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      // CMP-06 (D6) y ARQ-05 (Q3).
      '@typescript-eslint/no-restricted-imports': ['error', ENFORCED_RESTRICTED_IMPORTS],
      'no-restricted-syntax': [
        'error',
        {
          // CMP-07 (D7).
          selector: "Decorator[expression.callee.name='Component'] Property[key.name='styles']",
          message: 'CMP-07: usa styleUrl; no declares estilos inline.',
        },
        {
          // CMP-09 (Q3).
          selector:
            "Decorator[expression.callee.name=/^(Component|Directive|Pipe)$/] Property[key.name='standalone']",
          message: 'CMP-09: los componentes, directivas y pipes son standalone por defecto.',
        },
      ],

      // ── Pendientes de remediación: 'warn' ─────────────────────────────────
      // TODO(Fase 7): 'error' — CMP-01 (D3).
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      'no-restricted-imports': ['warn', { paths: RESTRICTED_IMPORT_PATHS }],
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
      // CMP-06 (D6).
      '@angular-eslint/template/prefer-class-binding': 'error',
      // UI-10 (Q5): <label> sin control → <span> con id + aria-labelledby.
      '@angular-eslint/template/label-has-associated-control': 'error',

      // Fase 8 (CAL-02): activar '@angular-eslint/template/i18n' al adoptar @angular/localize.
    },
  },
]);
