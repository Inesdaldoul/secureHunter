import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-interactive-map',
  templateUrl: './interactive-map.component.html'
})
export class InteractiveMapComponent implements AfterViewInit, OnChanges {
  @Input() geoData!: any[];
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map!: L.Map;
  private markerCluster!: L.MarkerClusterGroup;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(): void {
    if (this.map) this.updateMarkers();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [46.2276, 2.2137],
      zoom: 5,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerCluster = L.markerClusterGroup();
    this.map.addLayer(this.markerCluster);
  }

  private updateMarkers(): void {
    this.markerCluster.clearLayers();
    
    this.geoData.forEach(point => {
      const marker = L.marker([point.lat, point.lon])
        .bindPopup(`<b>${point.title}</b><br>${point.description}`);
      this.markerCluster.addLayer(marker);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}