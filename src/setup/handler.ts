/**
 * Setup Wizard Handler
 */

import { getConfigManager } from '../database/config-manager';
import { getSetupWizardHTML } from './templates';
import { htmlResponse, jsonResponse } from '../utils/helpers';
import type { Env, ConfigBackend } from '../types';

export async function handleSetup(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Validate env is provided for DB backends
  if (!env && path !== '/setup') {
    return jsonResponse({ error: 'Environment not configured' }, 500);
  }
  
  const manager = getConfigManager('static', env);
  const setupRequired = await manager.isSetupRequired();
  
  if (!setupRequired && !path.startsWith('/setup')) {
    return jsonResponse({ error: 'Setup already completed' }, 400);
  }

  if (path === '/setup' || path === '/setup/') {
    const step = parseInt(url.searchParams.get('step') || '1');
    return htmlResponse(getSetupWizardHTML(step));
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await request.json() as any;

  switch(path) {
    case '/setup/step1':
      return handleStep1(body, env);
    case '/setup/step2':
      return handleStep2(body, env);
    case '/setup/step3':
      return handleStep3(body, env);
    case '/setup/step4':
      return handleStep4(body, env);
    default:
      return jsonResponse({ error: 'Not found' }, 404);
  }
}

async function handleStep1(body: any, env: Env): Promise<Response> {
  const backend = body.backend as ConfigBackend;
  const manager = getConfigManager(backend, env);
  
  await manager.updateSetupState(2, false, { backend });
  return jsonResponse({ success: true });
}

async function handleStep2(body: any, env: Env): Promise<Response> {
  const state = await getConfigManager('static', env).getSetupState();
  const backend = state.setupData?.backend || 'static';
  
  const manager = getConfigManager(backend, env);
  const result = await manager.initialize();
  
  if (result.success) {
    await manager.updateSetupState(3, false, state.setupData);
  }
  
  return jsonResponse(result);
}

async function handleStep3(body: any, env: Env): Promise<Response> {
  const state = await getConfigManager('static', env).getSetupState();
  const manager = getConfigManager(state.setupData?.backend, env);
  
  await manager.setConfig('auth.siteName', body.siteName, 'auth');
  await manager.setConfig('system.admin_username', body.username, 'system');
  await manager.setConfig('system.admin_password', body.password, 'system');
  
  await manager.updateSetupState(4, false, { ...state.setupData, admin: body.username });
  return jsonResponse({ success: true });
}

async function handleStep4(body: any, env: Env): Promise<Response> {
  const state = await getConfigManager('static', env).getSetupState();
  const manager = getConfigManager(state.setupData?.backend, env);
  
  for (let i = 0; i < body.drives.length; i++) {
    const drive = body.drives[i];
    await manager.saveDrive(drive.id, drive.name, i, false);
  }
  
  await manager.updateSetupState(5, true, state.setupData);
  return jsonResponse({ success: true });
}
