/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@financial-planner/store$': '<rootDir>/../../packages/store/src/index.ts',
    '^@financial-planner/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@financial-planner/types$': '<rootDir>/../../packages/types/src/index.ts',
  },
  // Ensure ESM packages used in the monorepo are transformed by Babel
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand|immer)',
  ],
  testPathPattern: 'src/__tests__/.*\\.(test|spec)\\.(ts|tsx)$',
};
