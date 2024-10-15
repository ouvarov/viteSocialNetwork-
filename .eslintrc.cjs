module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-refresh',
    'import',
    'prettier',
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/prop-types": "off",
    "prettier/prettier": ["error", { "singleQuote": true }],
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/explicit-function-return-type": [
      1,
      {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }
    ],
    "react/state-in-constructor": [0],
    "no-console": "warn",
    "react/jsx-one-expression-per-line": [0],
    "react/jsx-curly-newline": "off",
    "import/no-extraneous-dependencies": ["error", { "devDependencies": true }],
    "no-unused-vars": ["error"],
    "react/jsx-props-no-spreading": [0],
    "react/static-property-placement": [0],
    'import/no-unresolved': 'error',
    "react/no-danger": "off"
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
}