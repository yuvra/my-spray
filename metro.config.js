const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Cloud Functions has its own node_modules — exclude from Metro watcher (fixes ENOENT on jose temp dirs)
config.watchFolders = [__dirname];
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(Array.isArray(config.resolver?.blockList) ? config.resolver.blockList : []),
    new RegExp(`${path.resolve(__dirname, 'functions').replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*`),
  ],
};

if (config.watcher) {
  config.watcher.additionalExcludes = [
    ...(config.watcher.additionalExcludes ?? []),
    'functions',
    'functions/**',
  ];
}

module.exports = config;
