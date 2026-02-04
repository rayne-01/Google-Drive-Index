/**
 * Configuration Backend Types
 * @version 3.0.0
 */

export type ConfigBackend = 'static' | 'd1' | 'hyperdrive';

export interface ConfigManager {
  backend: ConfigBackend;
  initialized: boolean;
  setupRequired: boolean;
}

export interface D1Config {
  enabled: boolean;
  database: string; // D1 binding name
}

export interface HyperDriveConfig {
  enabled: boolean;
  database: string; // HyperDrive binding name
  connectionString?: string;
}

export interface DatabaseConfig {
  backend: ConfigBackend;
  d1?: D1Config;
  hyperdrive?: HyperDriveConfig;
  setupPassword: string; // One-time setup password
  setupCompleted: boolean;
}

// Database schema for configuration storage
export interface ConfigTable {
  id: number;
  key: string;
  value: string; // JSON serialized
  category: 'auth' | 'ui' | 'player' | 'security' | 'drives' | 'system';
  updated_at: string;
  created_at: string;
}

export interface DriveTable {
  id: number;
  drive_id: string;
  name: string;
  order_index: number;
  protect_file_link: boolean;
  enabled: boolean;
  created_at: string;
}

export interface UserTable {
  id: number;
  username: string;
  password_hash: string;
  email?: string;
  role: 'admin' | 'user';
  enabled: boolean;
  created_at: string;
  last_login?: string;
}

export interface ServiceAccountTable {
  id: number;
  name: string;
  client_email: string;
  private_key: string; // Encrypted
  enabled: boolean;
  created_at: string;
}

export interface SetupStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface SetupState {
  currentStep: number;
  steps: SetupStep[];
  config: Partial<{
    siteName: string;
    adminUsername: string;
    adminPassword: string;
    drives: Array<{ id: string; name: string }>;
    backend: ConfigBackend;
  }>;
}
