// src/app/core/services/auth.service.ts (if not created yet)
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  get currentSessionId(): string {
    return localStorage.getItem('session_id') || '';
  }
}