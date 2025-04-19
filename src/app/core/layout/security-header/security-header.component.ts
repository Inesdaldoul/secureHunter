// src/app/core/layout/security-header/security-header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-security-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <header class="security-header">
      <div class="logo">
        <a routerLink="/">SecureHunter</a>
      </div>
      <nav>
        <!-- Your navigation items -->
        <ul>
          <li><a routerLink="/dashboard">Dashboard</a></li>
          <li><a routerLink="/threats">Threats</a></li>
          <li><a routerLink="/reports">Reports</a></li>
        </ul>
      </nav>
      <div class="user-controls">
        <!-- User controls -->
        <button mat-icon-button>
          <mat-icon>account_circle</mat-icon>
        </button>
        <button mat-icon-button>
          <mat-icon>settings</mat-icon>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .security-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
      height: 64px;
      background-color: #1a1a1a;
      color: white;
    }
    
    .logo a {
      color: white;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.2rem;
    }
    
    nav ul {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    nav ul li {
      margin: 0 1rem;
    }
    
    nav ul li a {
      color: white;
      text-decoration: none;
    }
    
    .user-controls {
      display: flex;
    }
  `]
})
export class SecurityHeaderComponent {}