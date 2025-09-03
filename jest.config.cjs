module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/tests/**/*.(test|spec).(ts|js)'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: true,
    },
  },
};
