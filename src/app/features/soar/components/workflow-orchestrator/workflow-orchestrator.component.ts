// workflow-orchestrator.component.ts
import { Component, OnInit } from '@angular/core';
import { SoarDataService } from '../../services/soar-data.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { UniversalConnector } from '../../../core/connectors/universal-connector.service';

@Component({
  selector: 'app-workflow-orchestrator',
  templateUrl: './workflow-orchestrator.component.html',
  styleUrls: ['./workflow-orchestrator.component.scss']
})
export class WorkflowOrchestratorComponent implements OnInit {
  workflows: any[] = [];
  selectedWorkflow?: any;
  executionLogs: string[] = [];

  constructor(
    private soarData: SoarDataService,
    private auditService: SecurityAuditService,
    private connector: UniversalConnector
  ) {}

  async ngOnInit() {
    this.workflows = await this.soarData.getWorkflows();
    this.auditService.logUserAction('WORKFLOWS_LOADED');
  }

  async executeWorkflow(workflow: any) {
    try {
      const result = await this.soarData.executeWorkflow(workflow.id);
      this.executionLogs = result.logs;
      this.auditService.logSecurityEvent({
        type: 'WORKFLOW_EXECUTED',
        details: { workflowId: workflow.id }
      });
    } catch (error) {
      this.auditService.logSecurityIncident('WORKFLOW_FAILURE', error);
    }
  }

  validateWorkflow(workflow: any) {
    const validation = this.connector.validateWorkflow(workflow);
    if (!validation.valid) {
      this.auditService.logSecurityIncident('INVALID_WORKFLOW', {
        errors: validation.errors
      });
    }
    return validation;
  }
}