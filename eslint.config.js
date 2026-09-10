'use strict';

// Config do ESLint 9 (flat config). Rodar com `npm run lint`.
// Regras propositalmente conservadoras: o objetivo aqui é pegar bugs reais
// (variável não usada, comparação perigosa, etc.), não forçar um estilo novo
// em cima de ~30 arquivos já escritos num padrão consistente.
module.exports = [
  {
    ignores: ['node_modules/**', 'exemplo-sem-js/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearInterval: 'readonly',
        setInterval: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-console': 'off',
    },
  },
];
