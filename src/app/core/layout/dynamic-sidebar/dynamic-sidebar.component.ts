// src/app/core/layout/dynamic-sidebar/dynamic-sidebar.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SecurityAuditService } from '../../services/security-audit.service';
import { main.ts } from '../../services/dashboard-config.service';
import { inject } from '@angular/core';

interface SidebarItem {
  label: string;
  icon: string;
  route?: string;
  children?: SidebarItem[];
  expanded?: boolean;
  requiredRole?: string;
}

@Component({
  selector: 'app-dynamic-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <div class="toggle" (click)="toggleCollapse()">
        <mat-icon>{{ collapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
      </div>
      
      <nav class="sidebar-nav">
        <ul>
          <li *ngFor="let item of filteredSidebarItems">
            <a 
              [routerLink]="item.route" 
              routerLinkActive="active"
              (click)="item.children && toggleExpand(item)"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              <span *ngIf="!collapsed">{{ item.label }}</span>
              <mat-icon *ngIf="!collapsed && item.children" class="expand-icon">
                {{ item.expanded ? 'expand_less' : 'expand_more' }}
              </mat-icon>
            </a>
            
            <ul *ngIf="item.children && item.expanded && !collapsed" class="submenu">
              <li *ngFor="let child of item.children">
                <a [routerLink]="child.route" routerLinkActive="active">
                  <mat-icon>{{ child.icon }}</mat-icon>
                  <span>{{ child.label }}</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100%;
      background-color: #222;
      transition: width 0.3s;
      overflow-x: hidden;
      position: relative;
    }
    
    .sidebar.collapsed {
      width: 60px;
    }
    
    .toggle {
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
      color: #a0a0a0;
      z-index: 10;
    }
    
    .sidebar-nav {
      padding-top: 60px;
    }
    
    .sidebar-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .sidebar-nav a {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: #a0a0a0;
      text-decoration: none;
      transition: color 0.2s, background-color 0.2s;
    }
    
    .sidebar-nav a.active,
    .sidebar-nav a:hover {
      background-color: #333;
      color: white;
    }
    
    .sidebar-nav mat-icon {
      margin-right: 16px;
    }
    
    .expand-icon {
      margin-left: auto !important;
      margin-right: 0 !important;
    }
    
    .submenu {
      margin-left: 16px;
    }
  `]
})
export class DynamicSidebarComponent implements OnInit {
  @Input() collapsed = false;
  
  private securityAuditService = inject(SecurityAuditService);
  private dashboardConfigService = inject(DashboardConfigService);
  
  sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { 
      label: 'Threats', 
      icon: 'security', 
      expanded: false,
      children: [
        { label: 'Active', icon: 'warning', route: '/threats/active' },
        { label: 'Resolved', icon: 'check_circle', route: '/threats/resolved' },
        { label: 'Analysis', icon: 'analytics', route: '/threats/analysis' }
      ]
    },
    { label: 'Reports', icon: 'assessment', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings', requiredRole: 'admin' }
  ];

  filteredSidebarItems: SidebarItem[] = [];
  
  ngOnInit() {
    // Filter items based on user roles
    this.filterSidebarItems();
    
    // Load any custom configurations
    this.loadDashboardConfig();
  }
  
  filterSidebarItems() {
    // This would normally check user roles from a service
    // For now, just include items that don't require a role
    this.filteredSidebarItems = this.sidebarItems.filter(item => {
      return !item.requiredRole; // || this.userService.hasRole(item.requiredRole);
    });
  }
  
  loadDashboardConfig() {
    const config = this.dashboardConfigService.getDefaultConfig();
    // Use the config to customize the sidebar if needed
  }
  
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }
  
  toggleExpand(item: SidebarItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }
}