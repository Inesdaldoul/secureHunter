// src/app/core/services/dashboard-config.service.ts
import { Injectable } from '@angular/core';

export interface DashboardConfig {
  title?: string;
  theme?: string;
  layout?: string;
  widgets?: string[];
  refreshRate?: number;
  defaultView?: string;
  versionSchema?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardConfigService {
  getDefaultConfig(): DashboardConfig {
    return {
      title: 'Security Dashboard',
      theme: 'dark',
      layout: 'default',
      widgets: ['threats', 'activity', 'logs'],
      refreshRate: 60,
      defaultView: 'overview',
      versionSchema: '2.1'
    };
  }
}