// src/app/core/interfaces/threat.interface.ts

// Define missing interfaces
export interface TemporalEntity {
  timestamp: Date;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
}

export interface Geolocatable {
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  region?: string;
  country?: string;
  city?: string;
  ip?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatContext {
  // Add the threat context properties here
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  source: string;
  relatedThreats?: string[];
  tags?: string[];
  description?: string;
}

export interface Threat extends TemporalEntity, Geolocatable {
  id: string;
  type: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'mitigated' | 'resolved' | 'false_positive';
  source: string;
  targetAssets: string[];
  context?: ThreatContext;
  audit: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
  mitigationPlan?: string;
  assignedTo?: string;
}