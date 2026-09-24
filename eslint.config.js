// @ts-check
// Configuración de ESLint (angular-eslint 21). Es el mecanismo de verificación automática de las
// reglas del proyecto (.specify/memory/constitution.md). Cada regla en 'warn' indica la fase de
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
    {
      name: '@angular/forms',
      importNames: ['FormsModule'],
      message: 'FRM-05: enlaza campos sueltos con (input) + signal; no uses ngModel.',
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

const SYNTAX_RESTRICTIONS = [
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
];

// EST-02 (D19): todo `.subscribe(` lleva `takeUntilDestroyed` como argumento de un `.pipe()` de su
// cadena.
const SUBSCRIBE_WITHOUT_TAKE_UNTIL = {
  selector:
    "CallExpression[callee.property.name='subscribe']:not(:has(CallExpression[callee.property.name='pipe'] > CallExpression[callee.name='takeUntilDestroyed']))",
  message: 'EST-02: añade takeUntilDestroyed(this.destroyRef) al pipe antes de subscribe.',
};

// CAL-02: atributos que no contienen texto para el usuario (la regla i18n los ignora).
const NON_TEXT_ATTRIBUTES = [
  'accent',
  'accept',
  'align',
  'appearance',
  'aria-controls',
  'aria-describedby',
  'aria-labelledby',
  'aria-live',
  'errorId',
  'icon',
  'link',
  'matTooltipPosition',
  'mode',
  'panelClass',
  'raiseHint',
  'rel',
  'size',
  'subscriptSizing',
  'variant',
  'xPosition',
];

/**
 * ARQ-02: una feature no importa internals de otra. Solo se permite la superficie pública
 * `features/<feature>/dialogs/`. Cubre imports relativos y el alias `@features/`.
 * En flat config, un bloque posterior reemplaza la configuración completa de la regla, así que
 * este bloque repite las restricciones globales de ENFORCED_RESTRICTED_IMPORTS.
 * @param {string} feature
 */
function crossFeatureImportsRule(feature) {
  const others = FEATURES.filter((f) => f !== feature).join('|');
  return {
    files: [`src/app/features/${feature}/**/*.ts`],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: ENFORCED_RESTRICTED_IMPORTS.paths,
          patterns: [
            ...ENFORCED_RESTRICTED_IMPORTS.patterns,
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
      // CMP-06 (D6), FRM-05 (D25) y ARQ-05 (Q3). En features/, además ARQ-02 (ver crossFeatureImportsRule).
      '@typescript-eslint/no-restricted-imports': ['error', ENFORCED_RESTRICTED_IMPORTS],
      'no-restricted-syntax': ['error', ...SYNTAX_RESTRICTIONS],
      // CMP-01 (D3).
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    },
  },
  {
    // EST-02 (D19). Un bloque posterior reemplaza la regla entera: repite SYNTAX_RESTRICTIONS.
    files: ['src/app/features/**/*.ts', 'src/app/shared/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...SYNTAX_RESTRICTIONS, SUBSCRIBE_WITHOUT_TAKE_UNTIL],
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
    // index.html no pasa por el compilador de Angular: @angular/localize solo ajusta su `lang`.
    // Las plantillas de los specs son componentes de prueba, no interfaz.
    ignores: ['src/index.html', '**/*.spec.ts/**'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // ── Ya se cumplen: 'error' ────────────────────────────────────────────
      '@angular-eslint/template/prefer-control-flow': 'error',
      // CMP-06 (D6).
      '@angular-eslint/template/prefer-class-binding': 'error',
      // UI-10 (Q5): <label> sin control → <span> con id + aria-labelledby.
      '@angular-eslint/template/label-has-associated-control': 'error',
      // CAL-02 (P5, Q1): todo texto visible lleva i18n con ID personalizado.
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: true,
          checkText: true,
          checkAttributes: true,
          // Un mismo texto se reutiliza con su ID en varias plantillas (p. ej. «Cancelar»). Un ID
          // repetido con otro texto lo detecta `ng extract-i18n`.
          checkDuplicateId: false,
          requireDescription: false,
          // Ligaduras de Material Icons: son nombres de icono, no texto.
          ignoreTags: ['mat-icon'],
          // Entradas de componentes y atributos técnicos que no son texto visible.
          ignoreAttributes: NON_TEXT_ATTRIBUTES,
        },
      ],
    },
  },
]);
