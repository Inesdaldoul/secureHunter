export const environment = {
  production: false,
  apiBaseUrl: 'https://api-dev.securehunter.ai/v1',
  enableDebugTools: true,
  cspPolicies: {
    defaultSrc: "'self'",
    connectSrc: "'self' https://api-dev.securehunter.ai",
  },
  featureToggles: {
    realtimeThreatMap: true,
    aiPredictions: false,
  },
  security: {
    sessionTimeout: 1800, // 30 minutes
    mfaRequired: false,
  }
};