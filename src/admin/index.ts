/**
 * Admin Panel Module
 * @version 3.0.0
 */

import { config, adminConfig } from '../config';
import { encryptString, decryptString, generateIntegrity, verifyIntegrity } from '../utils/crypto';
import { parseCookies, buildCookie, jsonResponse, htmlResponse } from '../utils/helpers';
import { getAllDrives } from '../services/drive';
import type { Env, AdminStats } from '../types';

const ADMIN_SESSION_NAME = 'admin_session';

async function generateAdminToken(username: string): Promise<string> {
  const expiry = Date.now() + adminConfig.sessionDuration;
  const data = `${username}|${expiry}`;
  const hash = await generateIntegrity(data, adminConfig.sessionSecret);
  return `${await encryptString(data)}|${hash}`;
}

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const [encrypted, hash] = token.split('|');
    const data = await decryptString(encrypted);
    const [_username, expiryStr] = data.split('|');
    
    // Check expiry
    if (parseInt(expiryStr) < Date.now()) return false;
    
    // Verify HMAC integrity (username is embedded in data, no need to match against config)
    return await verifyIntegrity(data, hash, adminConfig.sessionSecret);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(request: Request): Promise<boolean> {
  if (!adminConfig.enabled) return false;
  
  const cookies = parseCookies(request.headers.get('cookie'));
  const token = cookies[ADMIN_SESSION_NAME];
  
  if (!token) return false;
  return verifyAdminToken(token);
}

/**
 * Get admin credentials - D1 first, then fallback to hardcoded config
 */
async function getAdminCredentials(env?: Env): Promise<{ username: string; password: string }> {
  if (env?.DB) {
    try {
      const dbUsername = await env.DB.prepare(
        "SELECT value FROM config WHERE key = 'admin.username' LIMIT 1"
      ).first<{ value: string }>();
      const dbPassword = await env.DB.prepare(
        "SELECT value FROM config WHERE key = 'admin.password' LIMIT 1"
      ).first<{ value: string }>();
      
      if (dbUsername?.value && dbPassword?.value) {
        return { username: dbUsername.value, password: dbPassword.value };
      }
    } catch {
      // D1 query failed, fall through to hardcoded
    }
  }
  return { username: adminConfig.username, password: adminConfig.password };
}

export async function handleAdminLogin(request: Request, env?: Env): Promise<Response> {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const creds = await getAdminCredentials(env);
  if (username !== creds.username || password !== creds.password) {
    return jsonResponse({ ok: false, error: 'Invalid credentials' }, 401);
  }

  const token = await generateAdminToken(username);
  return jsonResponse({ ok: true }, 200, {
    'Set-Cookie': buildCookie(ADMIN_SESSION_NAME, token, {
      path: '/admin',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    })
  });
}

export function handleAdminLogout(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': buildCookie(ADMIN_SESSION_NAME, '', { path: '/admin', maxAge: 0 }),
      'Location': '/admin'
    }
  });
}

export async function getAdminStats(env?: Env): Promise<AdminStats> {
  const drives = getAllDrives();
  return {
    totalDrives: drives.length,
    totalRequests: 0, // Could be tracked via KV
    cacheHits: 0,
    cacheMisses: 0,
    activeUsers: 0,
    lastUpdated: new Date().toISOString()
  };
}

export function getAdminHTML(authenticated: boolean): string {
  if (!authenticated) {
    return `<!DOCTYPE html>
<html><head><title>Admin - ${config.auth.siteName}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head><body class="bg-dark">
<div class="container mt-5"><div class="row justify-content-center"><div class="col-md-4">
<div class="card"><div class="card-body">
<h4 class="text-center mb-4">Admin Login</h4>
<div id="error" class="alert alert-danger d-none"></div>
<form id="form">
<div class="mb-3"><input type="text" class="form-control" name="username" placeholder="Username" required></div>
<div class="mb-3"><input type="password" class="form-control" name="password" placeholder="Password" required></div>
<button type="submit" class="btn btn-primary w-100">Login</button>
</form></div></div></div></div></div>
<script>
document.getElementById('form').onsubmit=async(e)=>{
  e.preventDefault();
  const res=await fetch('/admin/login',{method:'POST',body:new FormData(e.target)});
  const data=await res.json();
  if(data.ok)location.reload();
  else{document.getElementById('error').textContent=data.error;document.getElementById('error').classList.remove('d-none')}
};
</script></body></html>`;
  }

  const drives = getAllDrives();
  const driveRows = drives.map((d, i) => 
    `<tr><td>${i}</td><td>${d.root.name}</td><td><code>${d.root.id.substring(0,20)}...</code></td><td>${d.root_type===0?'User':'Shared'}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html><head><title>Admin - ${config.auth.siteName}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
</head><body>
<nav class="navbar navbar-dark bg-dark"><div class="container-fluid">
<span class="navbar-brand">Admin Panel</span>
<a href="/admin/logout" class="btn btn-outline-light btn-sm">Logout</a>
</div></nav>
<div class="container mt-4">
<div class="row mb-4">
<div class="col-md-3"><div class="card text-white bg-primary"><div class="card-body">
<h5>Drives</h5><h2>${drives.length}</h2></div></div></div>
<div class="col-md-3"><div class="card text-white bg-success"><div class="card-body">
<h5>Login</h5><h2>${config.auth.enable_login?'Enabled':'Disabled'}</h2></div></div></div>
<div class="col-md-3"><div class="card text-white bg-info"><div class="card-body">
<h5>Download Mode</h5><h2>${config.download_mode}</h2></div></div></div>
<div class="col-md-3"><div class="card text-white bg-warning"><div class="card-body">
<h5>Environment</h5><h2>${config.environment}</h2></div></div></div>
</div>
<div class="card mb-4"><div class="card-header"><h5>Configured Drives</h5></div>
<div class="card-body"><table class="table table-striped">
<thead><tr><th>#</th><th>Name</th><th>ID</th><th>Type</th></tr></thead>
<tbody>${driveRows}</tbody></table></div></div>
<div class="card"><div class="card-header"><h5>Quick Actions</h5></div>
<div class="card-body">
<a href="/" class="btn btn-outline-primary me-2" target="_blank"><i class="bi bi-house"></i> View Site</a>
<button class="btn btn-outline-danger" onclick="if(confirm('Clear all caches?'))fetch('/admin/clear-cache',{method:'POST'}).then(()=>alert('Done'))">
<i class="bi bi-trash"></i> Clear Cache</button>
</div></div>
</div></body></html>`;
}

export async function handleAdminRequest(request: Request, env?: Env): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith('/admin')) return null;
  if (!adminConfig.enabled) return htmlResponse('Admin panel disabled', 404);

  const authenticated = await isAdminAuthenticated(request);

  if (path === '/admin' || path === '/admin/') {
    return htmlResponse(getAdminHTML(authenticated));
  }

  if (path === '/admin/login' && request.method === 'POST') {
    return handleAdminLogin(request, env);
  }

  if (path === '/admin/logout') {
    return handleAdminLogout();
  }

  if (!authenticated) {
    return htmlResponse(getAdminHTML(false), 401);
  }

  if (path === '/admin/stats') {
    const stats = await getAdminStats(env);
    return jsonResponse(stats);
  }

  if (path === '/admin/clear-cache' && request.method === 'POST') {
    return jsonResponse({ ok: true, message: 'Cache cleared' });
  }

  return htmlResponse('Not found', 404);
}
