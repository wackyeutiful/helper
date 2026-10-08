import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InterventionService } from '../../services/intervention.service';

@Component({
  selector: 'app-add-intervention',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-intervention.component.html',
  styleUrls: ['./add-intervention.component.css']
})
export class AddInterventionComponent {
  newIntervention = {
    vesselName: '',
    description: '',
    severity: 'MEDIUM',
    longitude: 5.92,
    latitude: 43.12
  };

  constructor(
    private interventionService: InterventionService,
    private router: Router
  ) {}

  addIntervention() {
    if (!this.newIntervention.vesselName.trim()) {
      alert('Le nom du navire est obligatoire');
      return;
    }

    const payload = {
      vesselName: this.newIntervention.vesselName.trim(),
      description: this.newIntervention.description.trim(),
      severity: this.newIntervention.severity,
      location: [this.newIntervention.longitude, this.newIntervention.latitude]
    };

    this.interventionService.addIntervention(payload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => alert('Erreur : ' + err.message)
    });
  }
}