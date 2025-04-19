import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VulnersService {
  private apiUrl = 'https://vulners.com/api/v3/search/lucene/'; // endpoint Vulners
  private apiKey = 'IBFGVVG7ZC597FCC857UM08HG6QHA7373E1C1MZ0S7JG85EXDEPN7A28MEODGWSO'; // Remplace par ta vraie clé

  constructor(private http: HttpClient) {}

  searchVulnerabilities(query: string): Observable<any> {
    const payload = {
      apiKey: this.apiKey,
      query: query,
      sort: 'cvss.score'
    };

    return this.http.post(this.apiUrl, payload);
  }
}
