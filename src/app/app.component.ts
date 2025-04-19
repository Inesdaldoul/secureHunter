// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { UniversalConnector, ServiceType } from './core/connectors/universal-connector.service';
import { ConnectionConfig } from './core/interfaces/connection-config.interface';
import { SecurityHeaderComponent } from './core/layout/security-header/security-header.component';
import { SecurityFooterComponent } from './core/layout/security-footer/security-footer.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SecurityHeaderComponent,
    SecurityFooterComponent
  ],
  template: `
    <div class="app-container">
      <app-security-header></app-security-header>
      <main>
        <router-outlet></router-outlet>
      </main>
      <app-security-footer></app-security-footer>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private readonly baseConnectionConfig: ConnectionConfig = {
    baseUrl: 'https://api.securehunter.com/v1',
    credentials: {
      accountId: 'YOUR_ACCOUNT_ID', // Added required accountId
      apiKey: 'YOUR_DEFAULT_API_KEY',
      clientId: 'YOUR_CLIENT_ID', // Optional
      clientSecret: 'YOUR_CLIENT_SECRET' // Optional
    },
    authType: 'apiKey'
  };

  constructor(
    public themeService: ThemeService,
    private universalConnector: UniversalConnector
  ) {}

  ngOnInit() {
    this.initializeCoreServices();
  }

  private async initializeCoreServices(): Promise<void> {
    this.themeService.setTheme('dark');
    try {
      await this.universalConnector.connect(ServiceType.VI, this.baseConnectionConfig);
      await this.universalConnector.connect(ServiceType.CTI, this.baseConnectionConfig);
    } catch (error) {
      console.error('Core services initialization failed:', error);
    }
  }
}