import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent {
  newAsset = {
    name: '',
    type: 'REMORQUEUR',
    status: 'AVAILABLE',
    longitude: 5.92,
    latitude: 43.12
  };

  constructor(
    private assetService: AssetService,
    private router: Router
  ) {}

  addAsset() {
    if (!this.newAsset.name.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    const assetToSend = {
      name: this.newAsset.name.trim(),
      type: this.newAsset.type,
      status: this.newAsset.status,
      location: [this.newAsset.longitude, this.newAsset.latitude]
    };

    this.assetService.addAsset(assetToSend).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => alert('Erreur : ' + err.message)
    });
  }
}