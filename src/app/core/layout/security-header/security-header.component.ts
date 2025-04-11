// security-header.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SecurityAuditService } from '../../services/security-audit.service';
import { ThreatService } from '../../../features/vi/services/vi-data.service';
import { UniversalConnector, ServiceType } from '../../connectors/universal-connector.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FeatureToggleService } from '../../config/feature-toggles.ts';

@Component({
  selector: 'app-security-header',
  templateUrl: './security-header.component.html',
  styleUrls: ['./security-header.component.scss']
})
export class SecurityHeaderComponent implements OnInit, OnDestroy {
  private subs = new Subscription();
  threatLevel?: number;
  sessionTimeout!: number;
  mfaEnabled = true;
  activeConnections: ServiceType[] = [];

  constructor(
    public auditService: SecurityAuditService,
    private threatService: ThreatService,
    private connector: UniversalConnector,
    private router: Router,
    private featureToggle: FeatureToggleService
  ) {}

  ngOnInit() {
    this.subs.add(
      this.threatService.realTimeThreats$.subscribe(threats => {
        this.threatLevel = this.calculateThreatLevel(threats);
      })
    );

    this.subs.add(
      this.connector.activeConnections.subscribe(connections => {
        this.activeConnections = Array.from(connections.keys());
      })
    );

    this.sessionTimeout = this.auditService.getSessionTimeout();
  }

  private calculateThreatLevel(threats: any[]): number {
    return Math.min(100, threats.length * 10);
  }

  quickAction(action: 'lock' | 'logout' | 'mfa') {
    switch(action) {
      case 'lock':
        this.router.navigate(['/lock']);
        break;
      case 'logout':
        this.connector.disconnectAll();
        this.router.navigate(['/logout']);
        break;
      case 'mfa':
        this.auditService.triggerMFA();
        break;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}