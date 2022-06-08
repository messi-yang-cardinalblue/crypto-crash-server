/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ['<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
