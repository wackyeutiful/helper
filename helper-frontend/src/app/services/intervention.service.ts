import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InterventionService {
  private apiUrl = '/api/interventions';

  constructor(private http: HttpClient) {}

  getInterventions(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addIntervention(intervention: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, intervention);
  }
}