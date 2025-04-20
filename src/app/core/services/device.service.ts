// src/app/core/services/device.service.ts (if not created yet)
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  async getSecureDeviceId(): Promise<string> {
    // In a real app, generate or retrieve a persistent device ID
    return 'dev-' + Math.random().toString(36).substring(2, 9);
  }
}