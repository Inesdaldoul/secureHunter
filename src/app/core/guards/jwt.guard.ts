// src/app/core/guards/jwt.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UniversalConnector } from '../connectors/universal-connector.service';

@Injectable({ providedIn: 'root' })
export class JwtGuard implements CanActivate {
  constructor(
    private connector: UniversalConnector,
    private router: Router
  ) {}
  
  canActivate(): boolean {
    const session = this.connector.getActiveSession();
    
    // Add null check to prevent "session is possibly null" error
    if (!session || !session.isValid) {
      // Redirect to login
      this.router.navigate(['/login']);
      return false;
    }
    
    return true;
  }
}