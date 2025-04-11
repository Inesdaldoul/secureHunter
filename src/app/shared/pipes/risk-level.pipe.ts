import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'riskLevel',
  standalone: true
})
export class RiskLevelPipe implements PipeTransform {
  transform(value: number): string {
    const levels = [
      { threshold: 9, label: 'Critical', color: '#ff4444' },
      { threshold: 7, label: 'High', color: '#ffbb33' },
      { threshold: 4, label: 'Medium', color: '#00C851' },
      { threshold: 0, label: 'Low', color: '#33b5e5' }
    ];

    return levels.find(l => value >= l.threshold)?.label || 'Unknown';
  }
}