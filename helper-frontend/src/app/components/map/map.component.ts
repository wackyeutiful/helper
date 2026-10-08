import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() assets: any[] = [];
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private isMapInitialized = false;

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assets'] && this.isMapInitialized) {
      this.updateMarkers();
    }
  }

  private initMap() {
    if (this.isMapInitialized) return;

    // Centre sur Toulon
    this.map = L.map('map').setView([43.12, 5.92], 9);

    // Fond de carte
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // 1. DESSINER LE CORRIDOR MARITIME (Toulon → Marseille)
    this.drawCorridor();

    // 2. DESSINER LA ZONE D'ACTIVITÉ
    this.drawActivityZone();

    this.isMapInitialized = true;

    if (this.assets && this.assets.length > 0) {
      this.updateMarkers();
    }
  }

  private drawCorridor() {
    // Corridor Toulon → Marseille
    const corridorPoints: L.LatLngExpression[] = [
      [43.12, 5.92],
      [43.18, 5.85],
      [43.22, 5.75],
      [43.25, 5.60],
      [43.29, 5.36]
    ];

    // Ligne pointillée bleue
    L.polyline(corridorPoints, {
      color: '#00aaff',
      weight: 4,
      opacity: 0.7,
      dashArray: '8, 6'
    }).addTo(this.map).bindPopup('🛳️ Corridor Maritime Toulon → Marseille');

    // Marqueur Toulon (bleu)
    L.marker([43.12, 5.92], {
      icon: L.divIcon({
        html: '<div style="background:#0077ff; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 20px #0077ff;"></div>',
        iconSize: [12, 12],
        className: 'custom-marker'
      })
    }).addTo(this.map).bindPopup('🚢 Port de Toulon');

    // Marqueur Marseille (bleu)
    L.marker([43.29, 5.36], {
      icon: L.divIcon({
        html: '<div style="background:#0077ff; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 20px #0077ff;"></div>',
        iconSize: [12, 12],
        className: 'custom-marker'
      })
    }).addTo(this.map).bindPopup('🚢 Port de Marseille');
  }

  private drawActivityZone() {
    // Zone d'activité intense (cercle orange translucide)
    L.circle([43.20, 5.70], {
      color: '#ff8c00',
      fillColor: '#ff8c00',
      fillOpacity: 0.15,
      radius: 25000, // 25 km
      weight: 2,
      dashArray: '4, 4'
    }).addTo(this.map).bindPopup('🔥 Zone d\'activité intense');
  }

  private updateMarkers() {
    if (!this.map) return;

    // Supprime les anciens marqueurs
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Ajoute les nouveaux marqueurs
    this.assets.forEach((asset: any) => {
      if (!asset.location || asset.location.length < 2) return;

      const [lng, lat] = asset.location;

      // Couleur selon le statut
      let color = '#00a86b'; // AVAILABLE = vert
      if (asset.status === 'ON_MISSION') color = '#ff8c00'; // orange
      else if (asset.status === 'MAINTENANCE') color = '#dc3545'; // rouge

      // Icône personnalisée
      const icon = L.divIcon({
        html: `<div style="
          width: 18px;
          height: 18px;
          background: ${color};
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 0 20px ${color}88, 0 4px 15px rgba(0,0,0,0.5);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        className: 'custom-marker'
      });

      const marker = L.marker([lat, lng], { icon }).addTo(this.map);

      marker.bindPopup(`
        <div style="font-family: 'Segoe UI', sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #00aaff;">${asset.name}</h3>
          <p style="margin: 4px 0;"><strong>Type :</strong> ${asset.type}</p>
          <p style="margin: 4px 0;"><strong>Statut :</strong>
            <span style="
              display: inline-block;
              padding: 2px 12px;
              border-radius: 12px;
              background: ${color};
              color: #fff;
              font-size: 0.8rem;
            ">${asset.status}</span>
          </p>
          <p style="margin: 4px 0; font-family: monospace; color: #88a8c8;">
            📍 ${lng}, ${lat}
          </p>
        </div>
      `);

      this.markers.push(marker);
    });

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }
}