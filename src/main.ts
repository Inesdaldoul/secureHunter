// src/main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';
import { JwtGuard } from './app/core/guards/jwt.guard';
import { DomSanitizer } from '@angular/platform-browser'; // Remove SecurityContext import

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error('Application bootstrap error:', err));