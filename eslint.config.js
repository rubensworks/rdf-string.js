const config = require('@rubensworks/eslint-config');

module.exports = config([
  {
    ignores: [
      'node_modules',
      'coverage',
      '.github',
      '**/*.js',
      '**/*.d.ts',
      '**/*.js.map',
    ],
  },
  {
    files: [ '**/*.ts' ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [ './tsconfig.eslint.json' ],
      },
    },
  },
]);
