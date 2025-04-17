import { Injectable } from '@angular/core';
import { Threat, ThreatIndicator, ThreatCriticality } from '../interfaces/threat.interface';
import { SecurityAuditService } from '../services/security-audit.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SanitizationService } from '../shared/services/sanitization.service';
import { ServiceType } from '../connectors/universal-connector.service';

@Injectable({ providedIn: 'root' })
export class DataNormalizer {
  private readonly NORMALIZATION_SCHEMAS = {
    [ServiceType.VI]: this.normalizeData.bind(this),
    [ServiceType.CTI]: this.normalizeData.bind(this),
    [ServiceType.ASM]: this.normalizeData.bind(this),
    [ServiceType.SOAR]: this.normalizeData.bind(this)
  };
  normalizeCTIData: any;
  extractVulnerabilityIndicators: any;
  calculateVulnerabilityImpact: any;

  constructor(
    private sanitizer: SanitizationService,
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService
  ) {}

  normalizeData(rawData: any, serviceType: ServiceType): Threat[] {
    try {
      const schemaHandler = this.NORMALIZATION_SCHEMAS[serviceType];
      if (!schemaHandler) throw new Error(`Unsupported service type: ${serviceType}`);

      const normalizedData = schemaHandler(rawData);
      return this.applyDataProtection(normalizedData);
    } catch (error) {
      this.handleNormalizationError(error, rawData);
      return [];
    }
  }

  private normalizeVIData(viData: any): Threat[] {
    return viData.vulnerabilities.map((vuln: any) => ({
      id: this.sanitizer.generateHashId(vuln),
      type: 'vulnerability',
      criticality: this.mapCVSSToCriticality(vuln.cvss),
      indicators: this.extractVulnerabilityIndicators(vuln),
      context: {
        attackPathAnalysis: vuln.attack_paths,
        potentialImpact: this.calculateVulnerabilityImpact(vuln)
      },
      // ... autres champs
    }));
  }

  private applyDataProtection(data: Threat[]): Threat[] {
    return data.map(threat => ({
      ...threat,
      context: {
        ...threat.context,
        thirdPartyRisk: threat.context.thirdPartyRisk?.map(r => ({
          ...r,
          vendorId: this.sanitizer.maskSensitiveData(r.vendorId)
        }))
      },
      indicators: threat.indicators.map(i => this.sanitizeIndicator(i))
    }));
  }

  private sanitizeIndicator(indicator: ThreatIndicator): ThreatIndicator {
    return {
      ...indicator,
      stixPattern: this.sanitizer.sanitizeSTIX(indicator.stixPattern),
      mitreTechnique: this.sanitizer.escapeHTML(indicator.mitreTechnique)
    };
  }

  private handleNormalizationError(error: any, rawData: any): void {
    this.auditService.logDataIncident({
      type: 'DATA_NORMALIZATION_FAILURE',
      severity: 'HIGH',
      rawData: this.sanitizer.sanitizeForLogs(rawData),
      error: this.errorHandler.processHttpError(error)
    });

    this.errorHandler.handleError(error, {
      category: 'DATA_PROCESSING',
      service: 'DataNormalizer'
    });
  }

  private mapCVSSToCriticality(cvss: number): ThreatCriticality {
    if (cvss >= 9) return ThreatCriticality.CRITICAL;
    if (cvss >= 7) return ThreatCriticality.HIGH_RISK;
    if (cvss >= 4) return ThreatCriticality.MEDIUM_RISK;
    return ThreatCriticality.LOW_RISK;
  }
}