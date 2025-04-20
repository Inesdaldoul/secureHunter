import { Injectable } from "@angular/core";

// src/app/core/config/feature-toggles.ts
@Injectable({ providedIn: 'root' })
export class FeatureToggleService {
  // Add CSP method
  getCSPPolicy(): string {
    return "default-src 'self'; script-src 'self' 'unsafe-inline'";
  }
}