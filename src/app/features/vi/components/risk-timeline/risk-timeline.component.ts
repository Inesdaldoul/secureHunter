// risk-timeline.component.ts
import { Component, OnInit } from '@angular/core';
import { ViDataService } from '../../services/vi-data.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { DataNormalizer } from '../../../core/utils/data-normalizer';

@Component({
  selector: 'app-risk-timeline',
  templateUrl: './risk-timeline.component.html',
  styleUrls: ['./risk-timeline.component.scss']
})
export class RiskTimelineComponent implements OnInit {
  timelineData: any;
  view: [number, number] = [800, 400];
  colorScheme = 'vivid';

  constructor(
    private viData: ViDataService,
    private normalizer: DataNormalizer,
    private auditService: SecurityAuditService
  ) {}

  async ngOnInit() {
    const rawData = await this.viData.getRiskHistory({
      timeframe: '7d',
      interval: '4h'
    });

    this.timelineData = this.normalizer.normalizeTimelineData(rawData);
    this.auditService.logUserAction('TIMELINE_LOADED');
  }

  onSelect(event: any) {
    this.auditService.logUserAction('TIMELINE_SELECT', {
      point: event
    });
  }
}