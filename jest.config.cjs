module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        target: 'es2020',
        parser: {
          syntax: 'typescript',
          tsx: false,
        },
      },
      module: {
        type: 'commonjs',
      },
    }],
  },
  testEnvironment: 'node',
  testTimeout: 15000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/tests/**/*.(test|spec).(ts|js)'],
};
