export default {
  // Enable ES module support (no need to include .js here)
  extensionsToTreatAsEsm: [],

  // Transform JavaScript files using Babel
  transform: {
    '^.+\\.js$': 'babel-jest', // Use Babel to transpile ES modules
  },

  // File extensions Jest should recognize
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],

  // Map imports for ES modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Optional: Alias @ to src directory
  },

  // Ignore transformations for all node_modules except specific ones
  transformIgnorePatterns: [
    'node_modules/(?!(module-that-needs-transform)/)', // Replace with actual module name if needed
  ],

  // Match test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)', // Tests inside __tests__ directories
    '**/?(*.)+(spec|test).[tj]s?(x)', // Files ending with .spec.js or .test.js
  ],
};