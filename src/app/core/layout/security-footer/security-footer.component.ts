// security-footer.component.ts
import { Component, OnInit } from '@angular/core';
import { SecurityAuditService } from '../../services/security-audit.service';
import { ComplianceService } from '../../services/compliance.service';

@Component({
  selector: 'app-security-footer',
  templateUrl: './security-footer.component.html',
  styleUrls: ['./security-footer.component.scss']
})
export class SecurityFooterComponent implements OnInit {
  complianceStatus!: string[];
  systemStatus!: string;
  lastAudit!: Date;

  constructor(
    public auditService: SecurityAuditService,
    private compliance: ComplianceService
  ) {}

  ngOnInit() {
    this.complianceStatus = this.compliance.getActiveCertifications();
    this.systemStatus = this.auditService.getSystemHealthStatus();
    this.lastAudit = this.auditService.getLastAuditDate();
  }
}