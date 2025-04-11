import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SecurityAuditService } from '../services/security-audit.service';
import { MLPredictorService } from '../shared/services/ml-predictor.service';
import { environment } from '../../../environments/environment';

interface FeatureToggle {
  name: string;
  enabled: boolean;
  activationStrategy: 'percentage' | 'role' | 'env' | 'ml-predictive';
  rules?: any;
}

@Injectable({ providedIn: 'root' })
export class FeatureToggleService {
  private toggles: FeatureToggle[] = [];
  private userContext: any = {};

  constructor(
    private http: HttpClient,
    private auditService: SecurityAuditService,
    private mlPredictor: MLPredictorService
  ) {}

  async loadFeatureToggles(): Promise<void> {
    try {
      const response = await this.http.get<FeatureToggle[]>(
        'assets/configs/feature-toggles.json'
      ).toPromise();
      
      this.toggles = this.filterEnvironmentToggles(response!);
      this.auditService.logSystemEvent('FEATURE_TOGGLES_LOADED');

    } catch (error) {
      this.auditService.logSecurityIncident({
        type: 'FEATURE_TOGGLE_LOAD_FAILURE',
        severity: 'HIGH'
      });
      throw error;
    }
  }

  isEnabled(featureName: string, context?: any): boolean {
    const toggle = this.toggles.find(t => t.name === featureName);
    if (!toggle) return false;

    return this.evaluateActivationStrategy(toggle, context);
  }

  private evaluateActivationStrategy(toggle: FeatureToggle, context: any): boolean {
    switch (toggle.activationStrategy) {
      case 'percentage':
        return this.checkPercentageRollout(toggle.rules);
      case 'role':
        return this.checkRoleBased(toggle.rules);
      case 'env':
        return this.checkEnvironment(toggle.rules);
      case 'ml-predictive':
        return this.checkMLPrediction(toggle.rules, context);
      default:
        return toggle.enabled;
    }
  }

  private checkMLPrediction(rules: any, context: any): boolean {
    const prediction = this.mlPredictor.predictFeatureActivation({
      feature: rules.featureName,
      userBehavior: context.userBehavior,
      systemLoad: context.systemLoad
    });
    return prediction > rules.threshold;
  }

  updateUserContext(context: any): void {
    this.userContext = { ...this.userContext, ...context };
  }

  private filterEnvironmentToggles(toggles: FeatureToggle[]): FeatureToggle[] {
    return toggles.filter(t => 
      t.rules?.environments?.includes(environment.name) ?? true
    );
  }
}