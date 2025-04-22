import { Injectable } from '@angular/core';

// Define an interface for error handling
interface ErrorDetails {
  error: unknown;
  service: string;
  category: string;
  endpoint?: string;
  severity?: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor() {}

  /**
   * Handle general errors and error details
   * @param error Error object or ErrorDetails object
   */
  handleError(error: Error | ErrorDetails): void {
    if (this.isErrorDetails(error)) {
      // Handling detailed error (ErrorDetails)
      console.error(`[${error.service}] Error in category '${error.category}'`);
      if (error.endpoint) {
        console.error(`Endpoint: ${error.endpoint}`);
      }
      console.error('Error details:', error.error);
    } else {
      // Handling regular Error object
      console.error('Error occurred:', error.name, error.message);
    }

    // Add common logging logic here, e.g., sending errors to an external service
    // This could be for monitoring or alerting
  }

  /**
   * Handle critical errors, often requiring session termination or redirection
   * @param error Error object (critical)
   */
  handleCriticalError(error: Error): void {
    console.error('CRITICAL ERROR:', error);
    // You could clear user session or navigate to an error page in case of critical errors
    localStorage.removeItem('user_session');
    window.location.href = '/error';
  }

  /**
   * Process HTTP errors into standardized Error format
   * @param error The error to process (typically from HTTP responses)
   * @returns Error object
   */
  processHttpError(error: any): Error {
    let errorMessage = 'Unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} ${error.statusText}`;
      if (error.error?.message) {
        errorMessage += ` - ${error.error.message}`;
      }
    }

    return new Error(errorMessage);
  }

  /**
   * Logs security-related events for auditing
   * @param event Security-related event
   */
  logSecurityEvent(event: any): void {
    console.warn('Security event logged:', event);
    // In a real implementation, you might forward this event to an audit service or an external logging tool
  }

  /**
   * Type guard to check if the error is an instance of ErrorDetails
   * @param obj The object to check
   * @returns true if the object is ErrorDetails, false otherwise
   */
  private isErrorDetails(obj: any): obj is ErrorDetails {
    return obj && typeof obj.service === 'string' && typeof obj.category === 'string';
  }
}
