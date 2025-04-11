// src/app/core/services/local-storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  get<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }
}