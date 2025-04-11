export enum WidgetRenderMode {
  REALTIME = 'realtime', // WebSocket/SSE
  LAZY = 'lazy', // Chargement différé
  ON_DEMAND = 'on-demand' // Manuel
}

export interface WidgetDataPipeline {
  preProcessing?: {
    normalizationRules: string; // JSONata
    anomalyDetection: boolean;
  };
  postProcessing?: {
    aggregation: 'sum' | 'average' | 'p99';
    dataMasking: {
      piiRedaction: boolean;
      anonymization: 'full' | 'partial';
    };
  };
}

export interface WidgetStateManagement {
  undoable: boolean;
  historySize: number;
  validationRules: string; // JSON Schema
}

export interface WidgetConfig {
  id: string;
  semanticType: string; // Ontologie de données
  dataSources: {
    primary: DataSource;
    fallback?: DataSource; // Pattern de résilience
  };
  renderEngine: {
    mode: WidgetRenderMode;
    progressiveLoading: boolean;
    errorBoundaries: string[]; // Composants de fallback
  };
  pipeline: WidgetDataPipeline;
  state: WidgetStateManagement;
  contextualAwareness: {
    userRoleAdaptive: boolean;
    envAdaptive: boolean;
    threatLevelAdaptive: boolean;
  };
  performance: {
    memoryQuota: number; // En Mo
    gpuAcceleration: boolean;
  };
}