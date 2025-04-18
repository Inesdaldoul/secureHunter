export interface ConnectionConfig {
    baseUrl: string;
    authType: 'oauth2' | 'apiKey';
    credentials: {
      accountId: string;
      clientId?: string;
      clientSecret?: string;
      apiKey?: string;
    };
  }