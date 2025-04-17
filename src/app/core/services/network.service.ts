// src/app/core/services/network.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  getClientIp(): string | PromiseLike<string> {
    throw new Error('Method not implemented.');
  }
  private onlineStatus = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  get isOnline(): boolean {
    return this.onlineStatus;
  }

  private updateOnlineStatus(): void {
    this.onlineStatus = navigator.onLine;
  }
}