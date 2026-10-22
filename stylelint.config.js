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
  },
};
