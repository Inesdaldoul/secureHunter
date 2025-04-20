// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';

// ⬇️ Import standalone components
import { AppComponent } from './app.component';
import { DynamicSidebarComponent } from './core/layout/dynamic-sidebar/dynamic-sidebar.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

@NgModule({
  // ❌ No declarations for standalone components
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    AppComponent,
    DynamicSidebarComponent,
    DashboardComponent
  ],
  providers: [
    { provide: 'API_ENDPOINTS', useValue: environment.apiEndpoints }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
