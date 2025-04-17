import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  async encrypt(data: string, key: string): Promise<string> {
    // TODO: chiffrement (AES, etc.)
    return data;
  }
  async decrypt(data: string, key: string): Promise<string> {
    // TODO: déchiffrement
    return data;
  }
  hash(data: string): string {
    // TODO: fonction de hachage (SHA-256, etc.)
    return data;
  }
}
