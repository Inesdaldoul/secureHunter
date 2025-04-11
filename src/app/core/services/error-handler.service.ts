import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { SecurityAuditService } from './security-audit.service';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService implements ErrorHandler {
  private audit?: SecurityAuditService;

  constructor(private injector: Injector) {
    // Injection différée pour éviter les problèmes d'initialisation
    setTimeout(() => {
      this.audit = this.injector.get(SecurityAuditService);
    });
  }

  handleError(error: any): void;
  handleError(params: { error: Error; service?: string; category?: string }): void;
  handleError(input: any): void {
    const error = input.error || input;
    const context = {
      service: input.service || 'global',
      category: input.category || 'unknown',
      message: error.message?.substring(0, 500),
      stack: error.stack?.split('\n').slice(0, 5)
    };

    this.audit?.log({
      eventType: 'RUNTIME_ERROR',
      severity: 'HIGH',
      context
    });

    console.error(`[${context.service}] Error (${context.category}):`, error);
  }

  createError(code: string, message: string, status: number): Error {
    const error = new Error(message);
    (error as any).statusCode = status;
    (error as any).code = code;
    return error;
  }
}