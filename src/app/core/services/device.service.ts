import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  async getSecureDeviceId(): Promise<string> {
    // TODO: générer ou récupérer un identifiant unique
    return 'unknown-device';
  }
}
