export interface SecureError extends Error {
  category?: string;
  service?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  context?: Record<string, unknown>;
}