import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Alert } from '../../core/interfaces/threat.interface';

@Component({
  selector: 'app-security-alerts',
  templateUrl: './security-alerts.component.html',
  styleUrls: ['./security-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityAlertsComponent {
  @Input() alerts: Alert[] = [];
  @Input() maxVisible = 5;
  @Output() acknowledge = new EventEmitter<string>();

  trackByAlertId(index: number, alert: Alert): string {
    return alert.id;
  }

  handleAcknowledge(alertId: string): void {
    this.acknowledge.emit(alertId);
  }
}