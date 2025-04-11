// threat-map.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CtiDataService } from '../../services/cti-data.service';
import { DataNormalizer } from '../../../core/utils/data-normalizer';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { UniversalConnector } from '../../../core/connectors/universal-connector.service';
import { Threat, ThreatCriticality } from '../../../core/interfaces/threat.interface';

@Component({
  selector: 'app-threat-map',
  templateUrl: './threat-map.component.html',
  styleUrls: ['./threat-map.component.scss']
})
export class ThreatMapComponent implements OnInit, OnDestroy {
  private map!: any;
  private heatmapLayer: any;
  private subs = new Subscription();
  
  threats: Threat[] = [];
  currentFilter = 'all';
  loading = true;

  constructor(
    private ctiData: CtiDataService,
    private normalizer: DataNormalizer,
    private auditService: SecurityAuditService,
    private connector: UniversalConnector
  ) {}

  async ngOnInit() {
    await this.initMap();
    this.loadThreatData();
    this.setupRealtime();
  }

  private async initMap() {
    const L = await import('leaflet');
    this.map = L.map('threat-map', {
      zoomSnap: 0.25,
      attributionControl: false,
      fadeAnimation: true
    }).setView([0, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      detectRetina: true
    }).addTo(this.map);

    this.heatmapLayer = L.heatLayer([], {
      radius: 25,
      blur: 15,
      gradient: { 
        0.4: 'blue', 
        0.6: 'lime', 
        0.8: 'yellow', 
        1.0: 'red' 
      }
    }).addTo(this.map);
  }

  private async loadThreatData() {
    try {
      const rawData = await this.ctiData.getGlobalThreats();
      this.threats = this.normalizer.normalizeData(rawData, 'cti');
      this.updateHeatmap();
      this.auditService.logUserAction('THREAT_MAP_LOADED');
    } catch (error) {
      this.auditService.logSecurityIncident('THREAT_MAP_FAILURE', error);
    } finally {
      this.loading = false;
    }
  }

  private updateHeatmap() {
    const points = this.threats
      .filter(t => this.currentFilter === 'all' || t.criticality === this.currentFilter)
      .map(t => [t.geoData.lat, t.geoData.lon, t.score]);
    
    this.heatmapLayer.setLatLngs(points);
  }

  private setupRealtime() {
    this.subs.add(
      this.ctiData.realtimeThreats$.subscribe(update => {
        this.threats = this.normalizer.mergeThreatUpdates(this.threats, update);
        this.updateHeatmap();
      })
    );
  }

  applyFilter(filter: string) {
    this.currentFilter = filter;
    this.updateHeatmap();
    this.auditService.logUserAction('MAP_FILTER_APPLIED', { filter });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    if (this.map) this.map.remove();
  }
}