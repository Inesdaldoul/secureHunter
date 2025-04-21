// src/main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';
import { JwtGuard } from './app/core/guards/jwt.guard';
import { DomSanitizer } from '@angular/platform-browser'; // Remove SecurityContext import

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter([/* your routes */])
    // Other providers
  ]
})