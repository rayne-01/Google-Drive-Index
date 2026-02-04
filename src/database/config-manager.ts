/**
 * Configuration Backend Manager
 * Supports Static, D1, and HyperDrive backends
 * @version 3.0.0
 */

import { config as staticConfig } from '../config';
import { D1_SCHEMA, HYPERDRIVE_SCHEMA, DEFAULT_CONFIG_VALUES } from './schema';
import type { ConfigBackend, DatabaseConfig } from '../types/config-backend';
import type { AppConfig, Env } from '../types';

export class ConfigBackendManager {
  private backend: ConfigBackend;
  private env?: Env;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(backend: ConfigBackend = 'static', env?: Env) {
    this.backend = backend;
    this.env = env;
  }

  /**
   * Initialize the backend (create tables if needed)
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.backend === 'static') {
        return { success: true };
      }

      if (this.backend === 'd1') {
        return await this.initializeD1();
      }

      if (this.backend === 'hyperdrive') {
        return await this.initializeHyperDrive();
      }

      return { success: false, error: 'Unknown backend' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check if setup is required
   */
  async isSetupRequired(): Promise<boolean> {
    if (this.backend === 'static') {
      return false;
    }

    try {
      const setupState = await this.getSetupState();
      return !setupState.completed;
    } catch {
      return true;
    }
  }

  /**
   * Get setup state
   */
  async getSetupState(): Promise<{ completed: boolean; currentStep: number; setupData?: any }> {
    if (this.backend === 'static') {
      return { completed: true, currentStep: 0 };
    }

    if (this.backend === 'd1' && this.env?.DB) {
      const result = await this.env.DB.prepare(
        'SELECT completed, current_step, setup_data FROM setup_state WHERE id = 1'
      ).first() as any;

      return {
        completed: Boolean(result?.completed),
        currentStep: result?.current_step || 1,
        setupData: result?.setup_data ? JSON.parse(result.setup_data) : undefined
      };
    }

    if (this.backend === 'hyperdrive' && this.env?.HYPERDRIVE) {
      // HyperDrive implementation
      const conn = this.env.HYPERDRIVE;
      const result = await conn.prepare(
        'SELECT completed, current_step, setup_data FROM setup_state WHERE id = 1'
      ).first() as any;

      return {
        completed: Boolean(result?.completed),
        currentStep: result?.current_step || 1,
        setupData: result?.setup_data ? JSON.parse(result.setup_data) : undefined
      };
    }

    return { completed: false, currentStep: 1 };
  }

  /**
   * Update setup state
   */
  async updateSetupState(step: number, completed: boolean, data?: any): Promise<void> {
    if (this.backend === 'static') return;

    const setupData = data ? JSON.stringify(data) : null;

    if (this.backend === 'd1' && this.env?.DB) {
      await this.env.DB.prepare(
        'UPDATE setup_state SET current_step = ?, completed = ?, setup_data = ?, completed_at = ? WHERE id = 1'
      ).bind(step, completed ? 1 : 0, setupData, completed ? new Date().toISOString() : null).run();
    }

    if (this.backend === 'hyperdrive' && this.env?.HYPERDRIVE) {
      await this.env.HYPERDRIVE.prepare(
        'UPDATE setup_state SET current_step = ?, completed = ?, setup_data = ?, completed_at = ? WHERE id = 1'
      ).bind(step, completed, setupData, completed ? new Date().toISOString() : null).run();
    }
  }

  /**
   * Get configuration value
   */
  async getConfig(key: string): Promise<any> {
    // Check cache
    const cached = this.getCached(key);
    if (cached !== undefined) return cached;

    if (this.backend === 'static') {
      return this.getStaticConfig(key);
    }

    if (this.backend === 'd1' && this.env?.DB) {
      const result = await this.env.DB.prepare(
        'SELECT value FROM config WHERE key = ?'
      ).bind(key).first() as any;

      if (result?.value) {
        const value = JSON.parse(result.value);
        this.setCache(key, value);
        return value;
      }
    }

    if (this.backend === 'hyperdrive' && this.env?.HYPERDRIVE) {
      const result = await this.env.HYPERDRIVE.prepare(
        'SELECT value FROM config WHERE key = ?'
      ).bind(key).first() as any;

      if (result?.value) {
        const value = JSON.parse(result.value);
        this.setCache(key, value);
        return value;
      }
    }

    // Fallback to default
    return DEFAULT_CONFIG_VALUES[key as keyof typeof DEFAULT_CONFIG_VALUES];
  }

  /**
   * Set configuration value
   */
  async setConfig(key: string, value: any, category: string): Promise<void> {
    if (this.backend === 'static') {
      throw new Error('Cannot modify static configuration');
    }

    const jsonValue = JSON.stringify(value);

    if (this.backend === 'd1' && this.env?.DB) {
      await this.env.DB.prepare(
        'INSERT INTO config (key, value, category) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
      ).bind(key, jsonValue, category, jsonValue).run();
    }

    if (this.backend === 'hyperdrive' && this.env?.HYPERDRIVE) {
      await this.env.HYPERDRIVE.prepare(
        'INSERT INTO config (key, value, category) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
      ).bind(key, jsonValue, category, jsonValue).run();
    }

    this.setCache(key, value);
  }

  /**
   * Get all drives
   */
  async getDrives(): Promise<Array<{ id: string; name: string; protect_file_link: boolean }>> {
    if (this.backend === 'static') {
      return staticConfig.auth.roots.map(r => ({
        id: r.id,
        name: r.name,
        protect_file_link: r.protect_file_link || false
      }));
    }

    const cached = this.getCached('drives.all');
    if (cached) return cached;

    let drives: any[] = [];

    if (this.backend === 'd1' && this.env?.DB) {
      const result = await this.env.DB.prepare(
        'SELECT drive_id, name, protect_file_link FROM drives WHERE enabled = 1 ORDER BY order_index'
      ).all();
      drives = result.results || [];
    }

    if (this.backend === 'hyperdrive' && this.env?.HYPERDRIVE) {
      const result = await this.env.HYPERDRIVE.prepare(
        'SELECT drive_id, name, protect_file_link FROM drives WHERE enabled = TRUE ORDER BY order_index'
      ).all();
      drives = result.results || [];
    }

    const formatted = drives.map(d => ({
      id: d.drive_id,
      name: d.name,
      protect_file_link: Boolean(d.protect_file_link)
    }));

    this.setCache('drives.all', formatted);
    return formatted;
  }

  /**
   * Add/Update drive
   */
  async saveDrive(driveId: string, name: string, orderIndex: number, protectLink: boolean = false): Promise<void> {
    if (this.backend === 'static') {
      throw new Error('Cannot modify static configuration');
    }

    if (this.backend === 'd1' && this.env?.DB) {
      await this.env.DB.prepare(
        'INSERT INTO drives (drive_id, name, order_index, protect_file_link) VALUES (?, ?, ?, ?) ON CONFLICT(drive_id) DO UPDATE SET name = ?, order_index = ?, protect_file_link = ?'
      ).bind(driveId, name, orderIndex, protectLink ? 1 : 0, name, orderIndex, protectLink ? 1 : 0).run();
    }

    if (this.backend === 'hyperdrive' && this.env?.HYPERDRIVE) {
      await this.env.HYPERDRIVE.prepare(
        'INSERT INTO drives (drive_id, name, order_index, protect_file_link) VALUES (?, ?, ?, ?) ON CONFLICT(drive_id) DO UPDATE SET name = ?, order_index = ?, protect_file_link = ?'
      ).bind(driveId, name, orderIndex, protectLink, name, orderIndex, protectLink).run();
    }

    this.clearCache('drives.all');
  }

  /**
   * Get full config object (for compatibility)
   */
  async getFullConfig(): Promise<AppConfig> {
    if (this.backend === 'static') {
      return staticConfig;
    }

    // Build config from database
    const drives = await this.getDrives();
    const siteName = await this.getConfig('auth.siteName');
    const theme = await this.getConfig('ui.theme');
    // ... build complete config object

    // For now, return static with overrides
    return {
      ...staticConfig,
      auth: {
        ...staticConfig.auth,
        siteName,
        roots: drives
      },
      ui: {
        ...staticConfig.ui,
        theme
      }
    };
  }

  // Private methods

  private async initializeD1(): Promise<{ success: boolean; error?: string }> {
    if (!this.env?.DB) {
      return { success: false, error: 'D1 database binding not found' };
    }

    try {
      // Execute schema
      const statements = D1_SCHEMA.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          await this.env.DB.prepare(stmt).run();
        }
      }

      // Insert default values
      for (const [key, value] of Object.entries(DEFAULT_CONFIG_VALUES)) {
        const [category] = key.split('.');
        await this.env.DB.prepare(
          'INSERT OR IGNORE INTO config (key, value, category) VALUES (?, ?, ?)'
        ).bind(key, JSON.stringify(value), category).run();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async initializeHyperDrive(): Promise<{ success: boolean; error?: string }> {
    if (!this.env?.HYPERDRIVE) {
      return { success: false, error: 'HyperDrive binding not found' };
    }

    try {
      // Execute schema
      const statements = HYPERDRIVE_SCHEMA.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          await this.env.HYPERDRIVE.prepare(stmt).run();
        }
      }

      // Insert default values
      for (const [key, value] of Object.entries(DEFAULT_CONFIG_VALUES)) {
        const [category] = key.split('.');
        await this.env.HYPERDRIVE.prepare(
          'INSERT INTO config (key, value, category) VALUES (?, ?, ?) ON CONFLICT DO NOTHING'
        ).bind(key, JSON.stringify(value), category).run();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private getStaticConfig(key: string): any {
    const parts = key.split('.');
    let value: any = staticConfig;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  private getCached(key: string): any {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && expiry > Date.now()) {
      return this.cache.get(key);
    }
    return undefined;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }
}

// Global instance
let configManager: ConfigBackendManager | null = null;

export function getConfigManager(backend?: ConfigBackend, env?: Env): ConfigBackendManager {
  if (!configManager) {
    configManager = new ConfigBackendManager(backend || 'static', env);
  }
  return configManager;
}

export function resetConfigManager(): void {
  configManager = null;
}
