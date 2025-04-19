// src/app/core/interfaces/connection-config.interface.ts
export interface ConnectionConfig {
  baseUrl: string;
  credentials: {
    accountId: string;
    apiKey: string;
    clientId?: string;
    clientSecret?: string;
  };
  authType: 'apiKey' | 'oauth' | 'jwt';
}