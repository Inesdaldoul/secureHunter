import { Injectable } from '@angular/core';
import { ServiceType } from '../connectors/universal-connector.service';

export interface HandledError {
  error: Error;
  service: string | ServiceType;
  category: 'CONNECTION' | 'ADAPTER' | 'DISCONNECT' | 'GENERAL' | string;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor() {}

  createError(code: string, message: string, statusCode: number): Error {
    const error = new Error(`[${code}] ${message}`);
    (error as any).statusCode = statusCode;
    return error;
  }

  // Overloaded signatures
  handleError(error: Error, context: { service: string; category: string }): void;
  handleError(payload: HandledError): void;

  // Implementation
  handleError(
    arg1: Error | HandledError,
    arg2?: { service: string; category: string }
  ): void {
    if (arg1 instanceof Error && arg2) {
      // Called as handleError(error, context)
      console.error('[ErrorHandler]', {
        message: arg1.message,
        stack: arg1.stack,
        service: arg2.service,
        category: arg2.category,
        statusCode: (arg1 as any)?.statusCode || 'N/A'
      });
    } else if ('error' in arg1) {
      // Called as handleError({ error, service, category })
      console.error('[ErrorHandler]', {
        message: arg1.error.message,
        stack: arg1.error.stack,
        service: arg1.service,
        category: arg1.category,
        statusCode: (arg1.error as any)?.statusCode || 'N/A'
      });
    } else {
      console.error('[ErrorHandler] Unknown error format', arg1);
    }
  }

  processHttpError(error: any): any {
    throw new Error('Method not implemented.');
  }

  handleCriticalError(error: any): void {
    console.error('[CriticalError]', error);
  }
}
