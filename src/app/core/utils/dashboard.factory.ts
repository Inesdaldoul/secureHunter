import { Injectable } from '@angular/core';
import { DashboardConfig, LayoutType, WidgetConfig, ThreatCriticality } from '../interfaces/dashboard-config.interface';
import { FeatureToggleService } from '../config/feature-toggles';
import { SecurityAuditService } from '../services/security-audit.service';
import { UniversalConnector, ServiceType } from '../connectors/universal-connector.service';
import { MLPredictorService } from '../shared/services/ml-predictor.service';

@Injectable({ providedIn: 'root' })
export class DashboardFactory {
  private readonly DASHBOARD_TEMPLATES = {
    [ServiceType.VI]: this.createVIDashboard.bind(this),
    [ServiceType.CTI]: this.createCTIDashboard.bind(this),
    [ServiceType.ASM]: this.createASMDashboard.bind(this),
    [ServiceType.SOAR]: this.createSOARDashboard.bind(this)
  };

  constructor(
    private featureToggle: FeatureToggleService,
    private auditService: SecurityAuditService,
    private connector: UniversalConnector,
    private mlPredictor: MLPredictorService
  ) {}

  async createDynamicDashboard(
    serviceType: ServiceType,
    userContext: any,
    threatLevel: ThreatCriticality
  ): Promise<DashboardConfig> {
    const baseConfig = await this.DASHBOARD_TEMPLATES[serviceType]();
    const enhancedConfig = this.applyContextualEnhancements(baseConfig, userContext, threatLevel);
    
    this.auditService.logDashboardEvent({
      action: 'DASHBOARD_CREATED',
      config: enhancedConfig,
      serviceType
    });

    return this.applySecurityPolicies(enhancedConfig);
  }

  private async createVIDashboard(): Promise<DashboardConfig> {
    const [dataSources, mlSuggestions] = await Promise.all([
      this.connector.getServiceDataSources(ServiceType.VI),
      this.mlPredictor.getLayoutSuggestions('VI_LAYOUT')
    ]);

    return {
      versionSchema: '2.1',
      layout: {
        type: mlSuggestions?.layoutType || LayoutType.RESPONSIVE_GRID,
        breakpoints: { xs: 576, sm: 768, md: 992, lg: 1200 },
        gridGap: 16
      },
      widgets: this.generateWidgets(dataSources, 'VI'),
      security: this.getBaseSecurityContext(),
      analytics: { /* ... */ },
      stateManagement: { undoRedoStackSize: 20, autoSaveInterval: 30000 }
    };
  }

  private generateWidgets(dataSources: any[], service: ServiceType): WidgetConfig[] {
    return dataSources.map(source => ({
      id: `${service}-${source.type}-${Date.now()}`,
      semanticType: source.metadata.semanticType,
      dataSources: { primary: source },
      renderEngine: {
        mode: 'realtime',
        progressiveLoading: true,
        errorBoundaries: ['fallback-widget']
      },
      contextualAwareness: {
        userRoleAdaptive: true,
        threatLevelAdaptive: true
      },
      performance: {
        memoryQuota: 256,
        gpuAcceleration: this.featureToggle.isEnabled('GPU_RENDERING')
      }
    }));
  }

  private applyContextualEnhancements(
    config: DashboardConfig,
    userContext: any,
    threatLevel: ThreatCriticality
  ): DashboardConfig {
    return {
      ...config,
      widgets: config.widgets
        .filter(widget => this.isWidgetAllowed(widget, userContext.roles))
        .map(widget => this.adaptWidgetToThreatLevel(widget, threatLevel))
    };
  }

  private applySecurityPolicies(config: DashboardConfig): DashboardConfig {
    return {
      ...config,
      security: {
        ...config.security,
        cspRules: this.featureToggle.getCSPRules(),
        dataIsolationLevel: 'tenant'
      },
      widgets: config.widgets.map(widget => ({
        ...widget,
        pipeline: this.addDataProtection(widget.pipeline)
      }))
    };
  }

  private addDataProtection(pipeline: any): any {
    return {
      ...pipeline,
      postProcessing: {
        aggregation: 'p99',
        dataMasking: {
          piiRedaction: true,
          anonymization: 'partial'
        }
      }
    };
  }
}