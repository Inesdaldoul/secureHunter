// src/app/core/interfaces/adapter.interface.ts
import { ConnectionConfig } from './connection-config.interface';

export interface AbstractAdapter {
  initialize(config: ConnectionConfig): Promise<any>;
  terminate(connection: any): Promise<void>;
}