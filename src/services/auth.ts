/**
 * Authentication Module
 * @version 3.0.0
 */

import { config } from '../config';
import { encryptString, decryptString, generateSessionToken, parseSessionToken } from '../utils/crypto';
import { parseCookies, buildCookie, jsonResponse, htmlResponse } from '../utils/helpers';
import type { Env } from '../types';

export interface AuthResult {
  authenticated: boolean;
  username?: string;
  error?: string;
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(
  username: string,
  password: string,
  env?: Env
): Promise<boolean> {
  const db = config.auth.login_database.toLowerCase();

  if (db === 'kv' && env?.ENV) {
    const storedPassword = await env.ENV.get(username);
    return storedPassword === password;
  }

  // Local database
  return config.auth.users_list.some(
    u => u.username === username && u.password === password
  );
}

/**
 * Check if user exists
 */
export async function userExists(username: string, env?: Env): Promise<boolean> {
  const db = config.auth.login_database.toLowerCase();

  if (db === 'kv' && env?.ENV) {
    const stored = await env.ENV.get(username);
    return stored !== null;
  }

  return config.auth.users_list.some(u => u.username === username);
}

/**
 * Create new user (KV only)
 */
export async function createUser(
  username: string,
  password: string,
  env?: Env
): Promise<{ success: boolean; error?: string }> {
  if (config.auth.login_database.toLowerCase() !== 'kv' || !env?.ENV) {
    return { success: false, error: 'Signup only supported with KV database' };
  }

  if (username.length < 8 || password.length < 8) {
    return { success: false, error: 'Username and password must be at least 8 characters' };
  }

  const exists = await userExists(username, env);
  if (exists) {
    return { success: false, error: 'User already exists' };
  }

  await env.ENV.put(username, password);
  return { success: true };
}

/**
 * Validate session from request
 */
export async function validateSession(
  request: Request,
  env?: Env
): Promise<AuthResult> {
  const cookies = parseCookies(request.headers.get('cookie'));
  const session = cookies['session'];

  if (!session || session === 'null' || session === '') {
    return { authenticated: false, error: 'No session' };
  }

  try {
    const parsed = await parseSessionToken(session);
    if (!parsed) {
      return { authenticated: false, error: 'Invalid or expired session' };
    }

    const { username, password, expiry } = parsed;

    // Check expiry
    if (expiry < Date.now()) {
      return { authenticated: false, error: 'Session expired' };
    }

    // Single session check
    if (config.auth.single_session && env?.ENV) {
      const storedSession = await env.ENV.get(`${username}_session`);
      if (storedSession !== session) {
        return { authenticated: false, error: 'Session invalidated' };
      }
    }

    // IP check
    if (config.auth.ip_changed_action && env?.ENV) {
      const userIp = request.headers.get('CF-Connecting-IP');
      const storedIp = await env.ENV.get(`${username}_ip`);
      if (storedIp && storedIp !== userIp) {
        return { authenticated: false, error: 'IP changed' };
      }
    }

    // Verify user still exists
    const exists = await userExists(username, env);
    if (!exists) {
      return { authenticated: false, error: 'User not found' };
    }

    return { authenticated: true, username };
  } catch {
    return { authenticated: false, error: 'Session validation failed' };
  }
}

/**
 * Handle login request
 */
export async function handleLogin(
  request: Request,
  env?: Env
): Promise<Response> {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const valid = await verifyCredentials(username, password, env);
  if (!valid) {
    return jsonResponse({ ok: false, error: 'Invalid credentials' });
  }

  const userIp = request.headers.get('CF-Connecting-IP');
  const sessionToken = await generateSessionToken(username, password);

  // Store session if single session enabled
  if (config.auth.single_session && env?.ENV) {
    await env.ENV.put(`${username}_session`, sessionToken);
  }

  // Store IP if IP lock enabled
  if (config.auth.ip_changed_action && userIp && env?.ENV) {
    await env.ENV.put(`${username}_ip`, userIp);
  }

  return jsonResponse({ ok: true }, 200, {
    'Set-Cookie': buildCookie('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    })
  });
}

/**
 * Handle signup request
 */
export async function handleSignup(
  request: Request,
  env?: Env
): Promise<Response> {
  if (!config.auth.enable_signup) {
    return jsonResponse({ ok: false, error: 'Signup disabled' }, 403);
  }

  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const result = await createUser(username, password, env);
  return jsonResponse({
    ok: result.success,
    error: result.error
  });
}

/**
 * Handle logout
 */
export function handleLogout(): Response {
  return new Response('Logged out', {
    status: 302,
    headers: {
      'Set-Cookie': buildCookie('session', '', { path: '/', maxAge: 0 }),
      'Location': '/?error=Logged%20Out'
    }
  });
}

/**
 * Check if request requires authentication
 */
export function requiresAuth(path: string): boolean {
  if (!config.auth.enable_login) return false;
  
  // Paths that don't require auth
  const publicPaths = ['/login', '/signup', '/signup_api', '/google_callback'];
  if (publicPaths.includes(path)) return false;
  
  // Anonymous downloads if enabled
  if (path === '/download.aspx' && !config.auth.disable_anonymous_download) {
    return false;
  }

  return true;
}
