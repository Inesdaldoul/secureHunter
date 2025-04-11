// intel-feed.component.ts
import { Component, OnInit } from '@angular/core';
import { CtiDataService } from '../../services/cti-data.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { DataNormalizer } from '../../../core/utils/data-normalizer';
import { Threat } from '../../../core/interfaces/threat.interface';

@Component({
  selector: 'app-intel-feed',
  templateUrl: './intel-feed.component.html',
  styleUrls: ['./intel-feed.component.scss']
})
export class IntelFeedComponent implements OnInit {
  threats$ = this.ctiData.realtimeThreats$;
  selectedThreat?: Threat;

  constructor(
    private ctiData: CtiDataService,
    public normalizer: DataNormalizer,
    private auditService: SecurityAuditService
  ) {}

  ngOnInit() {
    this.auditService.logUserAction('INTEL_FEED_ACCESSED');
  }

  selectThreat(threat: Threat) {
    this.selectedThreat = threat;
    this.auditService.logUserAction('THREAT_SELECTED', {
      threatId: threat.id
    });
  }

  trackByThreatId(index: number, threat: Threat): string {
    return threat.id;
  }
}