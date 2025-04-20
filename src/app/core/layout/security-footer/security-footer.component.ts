// src/app/core/layout/security-footer/security-footer.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-security-footer',
  template: `
    <footer class="security-footer">
      <div class="footer-content">
        <div class="copyright">
          © {{currentYear}} SecureHunter. All rights reserved.
        </div>
        <div class="links">
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/contact">Contact</a>
        </div>
        <div class="version">
          Version 1.0.0
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .security-footer {
      background-color: #1a1a2e;
      color: #e6e6e6;
      padding: 1rem;
      margin-top: auto;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .links {
      display: flex;
      gap: 1.5rem;
    }
    
    .links a {
      color: #e6e6e6;
      text-decoration: none;
      transition: color 0.3s;
    }
    
    .links a:hover {
      color: #4cc9f0;
    }
    
    .version {
      color: #888;
      font-size: 0.8rem;
    }
  `]
})
export class SecurityFooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  
  constructor() {}
  
  ngOnInit(): void {}
}