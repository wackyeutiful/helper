import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { MapComponent } from '../../components/map/map.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MapComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  assets: any[] = [];
  availableCount = 0;
  onMissionCount = 0;
  maintenanceCount = 0;

  constructor(
    private assetService: AssetService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssets();
  }

  loadAssets() {
    this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets = data;
        this.availableCount = data.filter(a => a.status === 'AVAILABLE').length;
        this.onMissionCount = data.filter(a => a.status === 'ON_MISSION').length;
        this.maintenanceCount = data.filter(a => a.status === 'MAINTENANCE').length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }
}