// Simple in-memory config storage
let userConfig = {
  apiKey: null,
  configured: false
};

export function getConfig() {
  return userConfig;
}

export function setConfig(newConfig) {
  userConfig = { ...userConfig, ...newConfig };
  userConfig.configured = !!userConfig.apiKey;
  return userConfig;
}
