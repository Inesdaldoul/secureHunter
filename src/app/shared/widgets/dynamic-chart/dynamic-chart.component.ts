import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { DashboardConfig } from '../../core/interfaces/dashboard-config.interface';

@Component({
  selector: 'app-dynamic-chart',
  templateUrl: './dynamic-chart.component.html',
  styleUrls: ['./dynamic-chart.component.scss']
})
export class DynamicChartComponent implements OnChanges, AfterViewInit {
  @Input() config!: DashboardConfig;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.updateChart();
    }
  }

  private initChart(): void {
    if (!this.config?.data) return;

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: this.config.chartType || 'bar',
      data: this.config.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { enabled: !this.config.disableTooltips }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.chart || !this.config?.data) return;

    this.chart.data = this.config.data;
    this.chart.update();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}