export const environment = {
  production: true,
  apiBaseUrl: 'https://api.securehunter.ai/v1',
  enableDebugTools: false,
  cspPolicies: {
    defaultSrc: "'none'",
    scriptSrc: "'self' 'sha256-...'",
    connectSrc: "'self' https://api.securehunter.ai wss://realtime.securehunter.ai",
  },
  featureToggles: {
    realtimeThreatMap: true,
    aiPredictions: true,
  },
  security: {
    sessionTimeout: 900, // 15 minutes
    mfaRequired: true,
  }
};