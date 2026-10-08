import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { InterventionService } from '../../services/intervention.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  assets: any[] = [];
  interventions: any[] = [];

  chatMessages: { sender: string; text: string }[] = [];
  userMessage: string = '';
  isChatLoading: boolean = false;
  isChatOpen: boolean = false;

  constructor(
    private assetService: AssetService,
    private interventionService: InterventionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssets();
    this.loadInterventions();
  }

  loadAssets() {
    this.assetService.getAssets().subscribe({
      next: (data) => { this.assets = data; },
      error: (err) => console.error('Erreur assets :', err)
    });
  }

  loadInterventions() {
    fetch('/api/interventions')
      .then(res => res.json())
      .then(data => {
        this.interventions = data;
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Erreur interventions :', err));
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;
    const msg = this.userMessage.trim();
    this.chatMessages.push({ sender: 'user', text: msg });
    this.userMessage = '';
    this.isChatLoading = true;

    fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    })
      .then(res => res.json())
      .then(data => {
        this.chatMessages.push({ sender: 'assistant', text: data.response || 'Je n\'ai pas compris.' });
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error('Chat error:', err);
        this.chatMessages.push({ sender: 'assistant', text: 'Erreur de connexion à l\'IA.' });
        this.cdr.detectChanges();
      })
      .finally(() => {
        this.isChatLoading = false;
        this.cdr.detectChanges();
      });
  }
}