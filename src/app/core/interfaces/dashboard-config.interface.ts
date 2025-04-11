export enum LayoutType {
  RESPONSIVE_GRID = 'responsive-grid', // Grille adaptative
  CANVAS = 'canvas', // Layout libre type Whiteboard
  KANBAN = 'kanban' // Pour les workflows
}

export interface DashboardSecurityContext {
  dataIsolationLevel: 'tenant' | 'user' | 'team';
  cspRules: {
    scriptSources: string[];
    connectSources: string[];
    frameAncestors: string[];
  };
  accessPolicy: {
    roles: string[];
    mfaRequired: boolean;
    maxSessionInactivity: number; // En secondes
  };
}

export interface DashboardUsageAnalytics {
  avgInteractionTime: number;
  mostAccessedWidgets: string[];
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
  };
}

export interface DashboardConfig {
  versionSchema: '2.1'; // Versionnement sémantique
  context: {
    env: 'prod' | 'staging' | 'dev';
    compliance: 'GDPR' | 'HIPAA' | 'PCI-DSS'[];
  };
  layout: {
    type: LayoutType;
    breakpoints: { xs: number; sm: number; md: number; lg: number };
    gridGap: number;
  };
  widgets: WidgetConfig[];
  security: DashboardSecurityContext;
  analytics: DashboardUsageAnalytics;
  stateManagement: {
    undoRedoStackSize: number;
    autoSaveInterval: number;
  };
}