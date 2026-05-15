const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const tmpDirPattern = [/.*\/_tmp_\d+(\/.*)*/];
const existing = config.resolver?.blockList;
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(existing ? (Array.isArray(existing) ? existing : [existing]) : []),
    ...tmpDirPattern,
  ],
};

module.exports = config;
