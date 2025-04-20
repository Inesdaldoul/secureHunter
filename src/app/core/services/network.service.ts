// src/app/core/services/network.service.ts (if not created yet)
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  get isOnline(): boolean {
    return navigator.onLine;
  }

  async getClientIp(): Promise<string> {
    // In a real implementation, this would be provided by a backend service
    return '127.0.0.1';
  }
}