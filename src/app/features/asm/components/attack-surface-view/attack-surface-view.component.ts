// attack-surface-view.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AsmDataService } from '../../services/asm-data.service';
import { DataNormalizer } from '../../../core/utils/data-normalizer';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { UniversalConnector } from '../../../core/connectors/universal-connector.service';
import { Asset, AttackSurface } from '../../../core/interfaces/asset.interface';

@Component({
  selector: 'app-attack-surface-view',
  templateUrl: './attack-surface-view.component.html',
  styleUrls: ['./attack-surface-view.component.scss']
})
export class AttackSurfaceViewComponent implements OnInit, OnDestroy {
  attackSurface!: AttackSurface;
  selectedAsset?: Asset;
  private subs = new Subscription();

  constructor(
    private asmData: AsmDataService,
    private normalizer: DataNormalizer,
    private auditService: SecurityAuditService,
    private connector: UniversalConnector
  ) {}

  async ngOnInit() {
    await this.loadAttackSurface();
    this.setupRealtimeUpdates();
  }

  private async loadAttackSurface() {
    try {
      const rawData = await this.asmData.getAttackSurface();
      this.attackSurface = this.normalizer.normalizeSurfaceData(rawData);
      this.auditService.logUserAction('SURFACE_LOADED');
    } catch (error) {
      this.auditService.logSecurityIncident('SURFACE_LOAD_FAILURE', error);
    }
  }

  private setupRealtimeUpdates() {
    this.subs.add(
      this.asmData.realtimeUpdates$.subscribe(update => {
        this.attackSurface = this.normalizer.mergeSurfaceUpdates(this.attackSurface, update);
      })
    );
  }

  selectAsset(asset: Asset) {
    this.selectedAsset = asset;
    this.auditService.logUserAction('ASSET_SELECTED', { assetId: asset.id });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}