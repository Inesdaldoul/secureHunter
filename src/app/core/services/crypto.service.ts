// src/app/core/services/crypto.service.ts (if not created yet)
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  async encrypt(data: string, key: string): Promise<string> {
    // Simple implementation for development
    // In production, use a real encryption library
    return btoa(data);
  }

  async decrypt(data: string, key: string): Promise<string> {
    // Simple implementation for development
    return atob(data);
  }

  hash(data: string): string {
    // Simple implementation - in production use a real hashing algorithm
    return btoa(data).substring(0, 16);
  }
}