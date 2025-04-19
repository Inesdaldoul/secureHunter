// src/app/shared/directives/leaflet.directive.ts
import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

@Directive({
  selector: '[appLeaflet]',
  standalone: true
})
export class LeafletDirective implements OnInit, OnChanges, OnDestroy {
  @Input() options: L.MapOptions = {};
  @Input() layers: L.Layer[] = [];
  
  private map?: L.Map;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }

    if (changes['layers'] && this.layers) {
      // Clear existing layers
      this.map.eachLayer((layer) => {
        if (layer !== L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')) {
          this.map?.removeLayer(layer);
        }
      });
      
      // Add new layers
      this.layers.forEach(layer => layer.addTo(this.map!));
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map(this.el.nativeElement, this.options);
    
    // Add default tile layer if not provided in options
    if (!this.options.layers || this.options.layers.length === 0) {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
    }
    
    // Add initial layers
    if (this.layers) {
      this.layers.forEach(layer => layer.addTo(this.map!));
    }
  }
}