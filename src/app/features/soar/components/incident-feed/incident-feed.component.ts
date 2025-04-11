// incident-feed.component.ts
import { Component, OnInit } from '@angular/core';
import { SoarDataService } from '../../services/soar-data.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { DataNormalizer } from '../../../core/utils/data-normalizer';

@Component({
  selector: 'app-incident-feed',
  templateUrl: './incident-feed.component.html',
  styleUrls: ['./incident-feed.component.scss']
})
export class IncidentFeedComponent implements OnInit {
  incidents: any[] = [];
  selectedIncident?: any;
  filters = {
    status: 'open',
    severity: 'high+'
  };

  constructor(
    private soarData: SoarDataService,
    private normalizer: DataNormalizer,
    private auditService: SecurityAuditService
  ) {}

  async ngOnInit() {
    await this.loadIncidents();
    this.setupRealtime();
  }

  private async loadIncidents() {
    const rawData = await this.soarData.getIncidents(this.filters);
    this.incidents = this.normalizer.normalizeIncidentData(rawData);
  }

  private setupRealtime() {
    this.soarData.realtimeIncidents$.subscribe(update => {
      this.incidents = this.normalizer.mergeIncidentUpdates(this.incidents, update);
    });
  }

  async updateStatus(incident: any, status: string) {
    await this.soarData.updateIncidentStatus(incident.id, status);
    this.auditService.logUserAction('INCIDENT_STATUS_CHANGED', {
      incidentId: incident.id,
      newStatus: status
    });
  }
}