/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  moduleNameMapper: {
    '^.*/lib/config$': '<rootDir>/__tests__/__mocks__/config.ts',
    '\\./config$': '<rootDir>/__tests__/__mocks__/config.ts',
    '^../lib/(.*)$': '<rootDir>/lib/$1',
    '^../services/(.*)$': '<rootDir>/services/$1'
  },
  clearMocks: true
};
