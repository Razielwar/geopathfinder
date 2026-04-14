import type { Config } from 'jest';

export default {
  testTimeout: 15000,
  maxWorkers: 1,
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: ['.*\\.spec\\.ts$'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(@turf|kdbush|geokdbush|tinyqueue)/)'],
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/index.ts'],
  coverageDirectory: './coverage',
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testEnvironment: 'node',
  resetMocks: true,
} satisfies Config;
