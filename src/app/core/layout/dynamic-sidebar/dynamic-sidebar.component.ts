// dynamic-sidebar.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DashboardConfig } from '../../interfaces/dashboard-config.interface';
import { DashboardConfigService } from '../../services/dashboard-config.service';
import { FeatureToggleService } from '../../config/feature-toggles.ts';
import { SecurityAuditService } from '../../services/security-audit.service';

@Component({
  selector: 'app-dynamic-sidebar',
  templateUrl: './dynamic-sidebar.component.html',
  styleUrls: ['./dynamic-sidebar.component.scss']
})
export class DynamicSidebarComponent implements OnInit {
  menuItems!: DashboardConfig[];
  activeRoute = '';
  isCollapsed = false;

  constructor(
    private router: Router,
    private configService: DashboardConfigService,
    public featureToggle: FeatureToggleService,
    private auditService: SecurityAuditService
  ) {}

  ngOnInit() {
    this.loadMenuStructure();
    this.trackRouteChanges();
  }

  private loadMenuStructure() {
    this.configService.getDashboardConfig().subscribe(config => {
      this.menuItems = config.filter(item => 
        this.featureToggle.isEnabled(item.featureFlag) &&
        this.auditService.hasRequiredRole(item.requiredRole)
      );
    });
  }

  private trackRouteChanges() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute = event.urlAfterRedirects;
      });
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.auditService.log('SIDEBAR_TOGGLE', { state: this.isCollapsed });
  }

  isMenuItemActive(itemPath: string): boolean {
    return this.activeRoute.includes(itemPath);
  }
}