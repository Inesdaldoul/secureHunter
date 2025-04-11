export enum ThreatCriticality {
  CRITICAL = 'critical', // Impact opérationnel immédiat
  HIGH_RISK = 'high-risk', // Impact financier > 1M$
  MEDIUM_RISK = 'medium-risk', // Impact réputationnel
  LOW_RISK = 'low-risk' // Vulnérabilité technique
}

export interface ThreatIndicator {
  stixPattern?: string; // Format STIX 2.1
  mitreTactic: string;
  mitreTechnique: string;
  confidenceLevel: number; // 0-100
  detectionCoverage: number; // Pourcentage de couverture
}

export interface ThreatContext {
  attackPathAnalysis: string[];
  potentialImpact: {
    financial?: number;
    reputation?: number;
    operational?: number;
  };
  thirdPartyRisk: {
    vendorId: string;
    slaImpact: boolean;
  }[];
}

export interface Threat extends TemporalEntity, Geolocatable {
  id: string;
  type: string;
  criticality: ThreatCriticality;
  indicators: ThreatIndicator[];
  context: ThreatContext;
  lifecycle: {
    detection: Date;
    containment: Date;
    eradication: Date;
    recovery: Date;
  };
  chainOfCustody: AuditEntry[]; // Historique des modifications
}