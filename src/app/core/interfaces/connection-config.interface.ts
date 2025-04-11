export interface ConnectionConfig {
    baseUrl: string;
    authType: 'oauth2' | 'apiKey';
    credentials: {
      clientId?: string;
      clientSecret?: string;
      apiKey?: string;
    };
  }