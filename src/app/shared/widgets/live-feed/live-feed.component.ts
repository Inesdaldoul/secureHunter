import { Component, Input, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../core/services/security-audit.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-live-feed',
  templateUrl: './live-feed.component.html'
})
export class LiveFeedComponent implements OnDestroy {
  @Input() maxItems = 50;
  feedItems: any[] = [];
  private wsSubscription!: Subscription;

  constructor(private wsService: WebSocketService) {
    this.wsSubscription = this.wsService.feed$.subscribe({
      next: (item) => this.handleNewItem(item),
      error: (err) => console.error('WebSocket error:', err)
    });
  }

  private handleNewItem(item: any): void {
    this.feedItems = [item, ...this.feedItems.slice(0, this.maxItems - 1)];
  }

  trackByItemId(index: number, item: any): string {
    return item.id;
  }

  ngOnDestroy(): void {
    this.wsSubscription.unsubscribe();
  }
}