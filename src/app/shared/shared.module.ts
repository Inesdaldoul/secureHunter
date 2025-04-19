// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletDirective } from './directives/leaflet.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    LeafletDirective
  ],
  exports: [
    LeafletDirective
  ]
})
export class SharedModule { }