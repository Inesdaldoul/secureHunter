// src/app/core/layout/security-footer/security-footer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-security-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="security-footer">
      <div class="copyright">
        &copy; 2025 SecureHunter. All rights reserved.
      </div>
      <div class="links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
      </div>
    </footer>
  `,
  styles: [`
    .security-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: #1a1a1a;
      color: #a0a0a0;
      font-size: 0.9rem;
    }
    
    .links {
      display: flex;
      gap: 1rem;
    }
    
    .links a {
      color: #a0a0a0;
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .links a:hover {
      color: white;
    }
  `]
})
export class SecurityFooterComponent {}