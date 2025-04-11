import { Component } from '@angular/core';
import { LoadingService } from '../../core/services/security-audit.service';

@Component({
  selector: 'app-global-loader',
  templateUrl: './global-loader.component.html',
  styleUrls: ['./global-loader.component.scss']
})
export class GlobalLoaderComponent {
  constructor(public loadingService: LoadingService) {}
}