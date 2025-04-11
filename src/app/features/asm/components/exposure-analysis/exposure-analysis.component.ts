// exposure-analysis.component.ts
import { Component, OnInit } from '@angular/core';
import { AsmDataService } from '../../services/asm-data.service';
import { DataNormalizer } from '../../../core/utils/data-normalizer';
import { SecurityAuditService } from '../../../core/services/security-audit.service';

@Component({
  selector: 'app-exposure-analysis',
  templateUrl: './exposure-analysis.component.html',
  styleUrls: ['./exposure-analysis.component.scss']
})
export class ExposureAnalysisComponent implements OnInit {
  exposureData: any;
  chartData: any[] = [];

  constructor(
    private asmData: AsmDataService,
    private normalizer: DataNormalizer,
    private auditService: SecurityAuditService
  ) {}

  async ngOnInit() {
    const rawData = await this.asmData.getExposureMetrics();
    this.exposureData = this.normalizer.normalizeExposureData(rawData);
    this.prepareChartData();
    this.auditService.logUserAction('EXPOSURE_ANALYSIS_LOADED');
  }

  private prepareChartData() {
    this.chartData = Object.entries(this.exposureData.categories).map(([name, value]) => ({
      name,
      value,
      extra: { riskLevel: this.calculateRiskLevel(value) }
    }));
  }

  private calculateRiskLevel(value: number): string {
    if (value > 75) return 'critical';
    if (value > 50) return 'high';
    if (value > 25) return 'medium';
    return 'low';
  }
}