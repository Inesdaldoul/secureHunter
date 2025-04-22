import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ServiceType } from './universal-connector-types';

export { ServiceType } from './universal-connector-types';

@Injectable({ providedIn: 'root' })

export class UniversalConnector {
  private sessionData: { isValid: boolean; roles: string[]; userId: string } | null = null;
  private activeConnections: Map<ServiceType, ConnectionConfig> = new Map();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Connect to a specific service type with the provided configuration
   */
  async connect(serviceType: ServiceType, config: ConnectionConfig): Promise<boolean> {
    try {
      // Store the connection config
      this.activeConnections.set(serviceType, config);
      
      // Implement your connection logic here
      console.log(`Connecting to ${serviceType} service with config:`, config);
      
      // Simulate API call
      // In a real implementation, you would make an HTTP call to validate the connection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error(`Failed to connect to ${serviceType}:`, error);
      return false;
    }
  }
  
  getActiveSession() {
    // Return cached session or retrieve it
    if (this.sessionData) {
      return this.sessionData;
    }
    
    // If no session in memory, try to get from storage
    const storedSession = localStorage.getItem('user_session');
    if (storedSession) {
      try {
        this.sessionData = JSON.parse(storedSession);
        return this.sessionData;
      } catch (e) {
        console.error('Failed to parse stored session', e);
      }
    }
    
    // Return default invalid session if none found
    return { isValid: false, roles: [], userId: '' };
  }
  
  refreshAuthToken(): Observable<string> {
    // Implement token refresh logic
    return this.http.post<{ token: string }>('/api/auth/refresh', {}).pipe(
      map(response => {
        const token = response.token;
        localStorage.setItem('auth_token', token);
        return token;
      }),
      catchError(error => {
        console.error('Token refresh failed', error);
        this.clearSession();
        throw error;
      })
    );
  }
  
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  clearSession(): void {
    this.sessionData = null;
    localStorage.removeItem('user_session');
    localStorage.removeItem('auth_token');
  }
  
  // Additional methods for working with connections
  getConnectionConfig(serviceType: ServiceType): ConnectionConfig | undefined {
    return this.activeConnections.get(serviceType);
  }
  
  getAllConnections(): Array<{ type: ServiceType; config: ConnectionConfig }> {
    const connections: Array<{ type: ServiceType; config: ConnectionConfig }> = [];
    this.activeConnections.forEach((config, type) => {
      connections.push({ type, config });
    });
    return connections;
  }
  
  async validateCurrentSession(): Promise<boolean> {
    // Example logic — customize as needed
    const token = localStorage.getItem('authToken');
    return !!token; // true if token exists
  }
}