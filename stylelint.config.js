export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-css-modules'],
  rules: {
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(_[a-z0-9]+)*(__[a-z0-9]+(_[a-z0-9]+)*)?(--[a-z0-9]+(_[a-z0-9]+)*)?$',
      {
        message: 'Class names are snake_case (optional __element / --modifier)',
      },
    ],
    'at-rule-disallowed-list': [
      ['import'],
      { message: 'Use @use instead of @import' },
    ],
    'max-nesting-depth': 3,
    'color-no-hex': [
      true,
      { message: 'Colors come from theme tokens: use theme() or use-theme()' },
    ],
    'color-named': [
      'never',
      { message: 'Colors come from theme tokens: use theme() or use-theme()' },
    ],
    'function-disallowed-list': [
      ['rgb', 'rgba', 'hsl', 'hsla'],
      { message: 'Colors come from theme tokens: use theme() or use-theme()' },
    ],
  },
  overrides: [
    {
      files: ['src/styles/_themes-data.scss'],
      rules: { 'color-no-hex': null },
    },
  ],
};
