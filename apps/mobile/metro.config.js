/**
 * Metro configuration for a pnpm monorepo.
 * Tells Metro to watch the workspace root and resolve modules from both
 * the app's own node_modules and the hoisted root node_modules.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all workspace packages so Metro hot-reloads on changes there too
config.watchFolders = [workspaceRoot];

// Resolve packages from the app first, then fall back to the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
