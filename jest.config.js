export default {
    // Use ESM for your tests
    type: "module",
    
    // Correctly handle ES modules
    transform: {
      "^.+\\.js$": "babel-jest"
    },
    moduleFileExtensions:
     ["js", "json", "jsx", "ts", "tsx", "node"],
    
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