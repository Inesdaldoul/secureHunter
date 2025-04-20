// src/app/core/layout/security-header/security-header.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-security-header',
  template: `
    <header class="security-header">
      <div class="logo">SecureHunter</div>
      <nav>
        <ul>
          <li><a routerLink="/dashboard">Dashboard</a></li>
          <li><a routerLink="/threats">Threat Intelligence</a></li>
          <li><a routerLink="/vulnerabilities">Vulnerabilities</a></li>
          <li><a routerLink="/settings">Settings</a></li>
        </ul>
      </nav>
      <div class="user-controls">
        <button class="profile-btn">Profile</button>
        <button class="logout-btn">Logout</button>
      </div>
    </header>
  `,
  styles: [`
    .security-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: #1a1a2e;
      color: white;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: #4cc9f0;
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
      color: #e6e6e6;
      text-decoration: none;
      transition: color 0.3s;
    }
    
    nav ul li a:hover {
      color: #4cc9f0;
    }
    
    .user-controls {
      display: flex;
      gap: 1rem;
    }
    
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .profile-btn {
      background-color: transparent;
      border: 1px solid #4cc9f0;
      color: #4cc9f0;
    }
    
    .logout-btn {
      background-color: #f72585;
      color: white;
    }
  `]
})
export class SecurityHeaderComponent implements OnInit {
  constructor() {}
  
  ngOnInit(): void {}
}