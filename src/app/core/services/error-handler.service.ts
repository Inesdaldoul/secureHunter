// src/app/core/services/error-handler.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor() {}
  
  handleError(error: Error): void {
    console.error('Error occurred:', error);
    // Add your error handling logic here
    // For example, send to error reporting service, show user notification, etc.
  }
  
  handleCriticalError(error: Error): void {
    console.error('CRITICAL ERROR:', error);
    // Handle critical errors - could redirect to error page, clear user session, etc.
    // For example:
    localStorage.removeItem('user_session');
    // Redirect to error page
    window.location.href = '/error';
  }
  
  processHttpError(error: any): Error {
    // Process HTTP errors into standardized format
    let errorMessage = 'Unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} ${error.statusText}`;
      if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
    }
    
    return new Error(errorMessage);
  }
  
  // Add this method that was used in the security interceptor
  logSecurityEvent(event: any): void {
    console.warn('Security event logged:', event);
    // In a real implementation, you would likely forward this to an audit service
  }
}