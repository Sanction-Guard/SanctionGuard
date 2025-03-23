// export default {
//   transform: {
//     "^.+\\.[t|j]sx?$": ["babel-jest", { presets: ["@babel/preset-env"] }]
//   },
//   testEnvironment: 'node',
//   extensionsToTreatAsEsm: [], // Remove .js as it's automatically inferred
//   globals: {
//     "ts-jest": {
//       useESM: true
//     }
//   },
//   moduleNameMapper: {
//     "^(\\.{1,2}/.*)\\.js$": "$1" // Map relative imports with .js extension
//   },
//   rootDir: "./"
// };

export default {
  // Use ESM for your tests
  type: "module",
  
  // Correctly handle ES modules
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  
  // This matches your actual import paths
  moduleNameMapper: {
    // Be cautious with this pattern if causing issues
    // "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  
  // For mocking modules that use ES modules
  transformIgnorePatterns: [
    "node_modules/(?!(module-that-needs-transform)/)"
  ]
};