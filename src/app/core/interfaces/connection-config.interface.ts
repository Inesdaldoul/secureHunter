// src/app/core/interfaces/connection-config.interface.ts
export interface ConnectionConfig {
  baseUrl: string;
  credentials: {
    accountId: string;
    apiKey: string;
    clientId?: string;
    clientSecret?: string;
    [key: string]: string | undefined;
  };
  authType: 'apiKey' | 'oauth' | 'basic';
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    delayMs: number;
  };
}