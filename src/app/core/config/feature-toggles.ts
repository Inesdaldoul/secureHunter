// src/app/core/config/feature-toggles.ts
import { Injectable } from '@angular/core';
import { ServiceType } from '../connectors/universal-connector.service';

@Injectable({
  providedIn: 'root',
})
export class FeatureToggleService {
  private serviceToggles: Record<ServiceType, boolean> = {
    [ServiceType.VI]: true,
    [ServiceType.CTI]: true,
    [ServiceType.ASM]: false,
    [ServiceType.SOAR]: true,
  };

  private features: Record<string, boolean> = {
    enableDarkMode: true,
    enableAuditLogging: true,
    enableSomeFeature: false,
  };

  isEnabled(type: ServiceType): boolean {
    return !!this.serviceToggles[type];
  }

  isFeatureEnabled(feature: string): boolean {
    return !!this.features[feature];
  }

  getCSPRules: any;
  getCSPPolicy(): string | string[] {
    // Optional: implement CSP if needed
    return "default-src 'self'";
  }
}
