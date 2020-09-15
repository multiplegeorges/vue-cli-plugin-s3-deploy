module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  plugins: [
    '@typescript-eslint',
    'standard',
  ],
  extends: [
    'standard',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/standard',
  ],
  env: {
    'node': true
  },
  rules: {}
};
