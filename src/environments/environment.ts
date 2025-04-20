// src/environments/environment.ts
export const environment = {
  production: false,
  AUDIT_ENCRYPTION_KEY: 'dev-secure-key',
  apiEndpoints: {
    vi: 'http://localhost:3000/vi',
    cti: 'http://localhost:3000/cti',
    asm: 'http://localhost:3000/asm',
    soar: 'http://localhost:3000/soar'
  }
};