// src/app/core/services/dashboard-config.service.ts
import { Injectable } from '@angular/core';

export interface DashboardConfig {
  id: string;
  name: string;
  layout: any[];
  items: DashboardItem[];
  isDefault?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DashboardItem {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'map';
  title: string;
  dataSource: string;
  config: Record<string, any>;
  size: {
    cols: number;
    rows: number;
  };
  position?: {
    x: number;
    y: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardConfigService {
  private configs: DashboardConfig[] = [
    {
      id: 'default',
      name: 'Security Overview',
      layout: [],
      items: [
        {
          id: 'threats-by-severity',
          type: 'chart',
          title: 'Threats by Severity',
          dataSource: 'threats/summary',
          config: {
            chartType: 'pie'
          },
          size: {
            cols: 2,
            rows: 2
          }
        },
        {
          id: 'active-threats',
          type: 'metric',
          title: 'Active Threats',
          dataSource: 'threats/active/count',
          config: {
            icon: 'warning',
            thresholds: {
              critical: 10,
              warning: 5
            }
          },
          size: {
            cols: 1,
            rows: 1
          }
        }
      ],
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  getDefaultConfig(): DashboardConfig {
    return this.configs.find(config => config.isDefault) || this.configs[0];
  }

  getConfigById(id: string): DashboardConfig | undefined {
    return this.configs.find(config => config.id === id);
  }

  getAllConfigs(): DashboardConfig[] {
    return [...this.configs];
  }

  saveConfig(config: DashboardConfig): void {
    const index = this.configs.findIndex(c => c.id === config.id);
    if (index >= 0) {
      this.configs[index] = {...config, updatedAt: new Date()};
    } else {
      this.configs.push({...config, createdAt: new Date(), updatedAt: new Date()});
    }
  }
}