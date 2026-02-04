/**
 * Main Router & Request Handlers
 * @version 3.0.0
 */

import { config } from '../config';
import { initDrives, getDrive, getAllDrives, GoogleDrive } from '../services/drive';
import { validateSession, handleLogin, handleSignup, handleLogout, requiresAuth } from '../services/auth';
import { encryptString, decryptString, generateDownloadLink, verifyDownloadLink } from '../utils/crypto';
import { jsonResponse, htmlResponse, redirectResponse } from '../utils/helpers';
import { getMainHTML, getHomepageHTML, getLoginHTML, getErrorHTML, getBlockedHTML } from '../templates';
import { handleAdminRequest } from '../admin';
import { handleSetup } from '../setup';
import { getConfigManager } from '../database';
import type { Env, DriveFile, ListRequestBody, SearchRequestBody, ConfigBackend } from '../types';

/**
 * Main request handler
 */
export async function handleRequest(request: Request, env?: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const userIp = request.headers.get('CF-Connecting-IP') || '';

    // Check if setup is required
    const backend = (config as any).configBackend || 'static';
    const configManager = getConfigManager(backend as ConfigBackend, env);
    const setupRequired = await configManager.isSetupRequired();
    
    if (setupRequired && !path.startsWith('/setup')) {
      return redirectResponse('/setup');
    }

    // Setup wizard
    if (path.startsWith('/setup')) {
      return handleSetup(request, env!);
    }

    // Check blocked regions/ASNs
    const cf = (request as any).cf;
    if (cf) {
      const region = cf.country as string;
      const asn = cf.asn as number;
      
      if (config.blocked_region.includes(region?.toUpperCase())) {
        return htmlResponse(getBlockedHTML(), 403);
      }
      if (config.blocked_asn.includes(asn)) {
        return htmlResponse(getBlockedHTML(), 403);
      }
    }

    // Admin panel
    const adminResponse = await handleAdminRequest(request, env);
    if (adminResponse) return adminResponse;

    // Static routes
    if (path === '/logout') return handleLogout();
    
    if (path === '/login') {
      if (request.method === 'POST') return handleLogin(request, env);
      return htmlResponse(getLoginHTML());
    }

    if (path === '/signup' && config.auth.enable_signup) {
      if (request.method === 'POST') return handleSignup(request, env);
      return htmlResponse(getLoginHTML()); // Use same template with signup mode
    }

    // Authentication check
    if (requiresAuth(path)) {
      const auth = await validateSession(request, env);
      if (!auth.authenticated) {
        return htmlResponse(getLoginHTML(), 401);
      }
    }

    // Initialize drives
    await initDrives();

    // Homepage
    if (path === '/') {
      return htmlResponse(getHomepageHTML());
    }

    // Download handler
    if (path === '/download.aspx') {
      return handleDownload(request, userIp);
    }

    // Find path by ID (redirect)
    if (path === '/findpath') {
      const id = url.searchParams.get('id');
      const view = url.searchParams.get('view') === 'true';
      if (!id) return htmlResponse(getErrorHTML(400, 'Missing ID'), 400);
      return redirectResponse(`/0:findpath?id=${id}&view=${view}`);
    }

    // Fallback route for ID-based access
    if (path === '/fallback') {
      return htmlResponse(getMainHTML(0, { is_search_page: false, root_type: 1 }));
    }

    // Drive-specific routes: /{num}:{command}
    const driveMatch = path.match(/^\/(\d+):(\w+)(\/.*)?$/);
    if (driveMatch) {
      const driveIndex = parseInt(driveMatch[1]);
      const command = driveMatch[2];
      const drive = getDrive(driveIndex);
      
      if (!drive) return redirectResponse('/0:/');

      switch (command) {
        case 'search':
          return handleSearch(request, drive, userIp);
        case 'id2path':
          return handleId2Path(request, drive);
        case 'fallback':
          return handleFallback(request, drive, userIp);
        case 'findpath':
          return handleFindPath(request, drive, url);
      }
    }

    // Path-based routes: /{num}:/path/to/file
    const pathMatch = path.match(/^\/(\d+):\/(.*)$/);
    if (pathMatch) {
      const driveIndex = parseInt(pathMatch[1]);
      const drivePath = '/' + pathMatch[2];
      const drive = getDrive(driveIndex);
      
      if (!drive) return redirectResponse('/0:/');

      // POST = API request for listing
      if (request.method === 'POST') {
        return handleListRequest(request, drive, drivePath, userIp);
      }

      // GET with ?a=view or trailing slash = render page
      const action = url.searchParams.get('a');
      if (drivePath.endsWith('/') || action) {
        return htmlResponse(getMainHTML(drive.order, { is_search_page: false, root_type: drive.root_type }));
      }

      // Direct file access (path-based download)
      if (config.download_mode === 'path') {
        return handlePathDownload(request, drive, drivePath);
      }

      // ID-based: redirect to view
      return htmlResponse(getMainHTML(drive.order, { is_search_page: false, root_type: drive.root_type }));
    }

    return redirectResponse('/0:/');
  } catch (error) {
    console.error('Request error:', error);
    return htmlResponse(getErrorHTML(500, 'Internal Server Error'), 500);
  }
}

async function handleDownload(request: Request, userIp: string): Promise<Response> {
  const url = new URL(request.url);
  const encryptedFile = url.searchParams.get('file');
  const encryptedExpiry = url.searchParams.get('expiry');
  const mac = url.searchParams.get('mac');

  if (!encryptedFile || !encryptedExpiry || !mac) {
    return htmlResponse(getErrorHTML(400, 'Invalid download link'), 400);
  }

  const verified = await verifyDownloadLink(encryptedFile, encryptedExpiry, mac, userIp);
  if (!verified) {
    return htmlResponse(getErrorHTML(401, 'Invalid or expired download link'), 401);
  }

  const range = request.headers.get('Range') || '';
  const inline = url.searchParams.get('inline') === 'true';
  
  return downloadFile(verified.fileId, range, inline);
}

async function handlePathDownload(request: Request, drive: GoogleDrive, path: string): Promise<Response> {
  const file = await drive.getSingleFile(path);
  if (!file) {
    return htmlResponse(getErrorHTML(404, 'File not found'), 404);
  }

  const range = request.headers.get('Range') || '';
  const inline = new URL(request.url).searchParams.get('inline') === 'true';
  
  return downloadFile(file.id, range, inline);
}

async function downloadFile(fileId: string, range: string, inline: boolean): Promise<Response> {
  const drives = getAllDrives();
  const drive = drives[0];
  
  const file = await drive.findItemById(fileId);
  if (!file?.name) {
    return jsonResponse({ error: 'File not found' }, 404);
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const token = await (await import('../services/drive')).getAccessToken();
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Range: range
    }
  });

  if (!response.ok) {
    return htmlResponse(getErrorHTML(response.status, 'Download failed'), response.status);
  }

  const headers = new Headers(response.headers);
  headers.set('Content-Disposition', inline ? 'inline' : `attachment; filename="${file.name}"`);
  if (file.size) headers.set('Content-Length', file.size);
  if (config.auth.enable_cors_file_down) headers.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, { status: response.status, headers });
}

async function handleListRequest(request: Request, drive: GoogleDrive, path: string, userIp: string): Promise<Response> {
  const body = await request.json() as ListRequestBody;
  const result = await drive.listFiles(path, body.page_token || undefined, body.page_index || 0);

  // Encrypt file IDs and generate download links
  const encryptedFiles = await Promise.all(result.data.files.map(async (file) => {
    const encryptedId = await encryptString(file.id);
    const encryptedDriveId = file.driveId ? await encryptString(file.driveId) : '';
    const link = file.mimeType !== 'application/vnd.google-apps.folder' 
      ? await generateDownloadLink(file.id, userIp) 
      : undefined;

    return { ...file, id: encryptedId, driveId: encryptedDriveId, link };
  }));

  return jsonResponse({
    nextPageToken: result.nextPageToken,
    curPageIndex: result.curPageIndex,
    data: { files: encryptedFiles }
  });
}

async function handleSearch(request: Request, drive: GoogleDrive, userIp: string): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const q = url.searchParams.get('q')?.replace(/['"]/g, '') || '';
    return htmlResponse(getMainHTML(drive.order, { is_search_page: true, q, root_type: drive.root_type }));
  }

  const body = await request.json() as SearchRequestBody;
  if (!body.q) {
    return jsonResponse({ nextPageToken: null, curPageIndex: 0, data: { files: [] } });
  }

  const result = await drive.search(body.q, body.page_token || undefined, body.page_index || 0);
  if (!result.data) {
    return jsonResponse(result);
  }

  const encryptedFiles = await Promise.all(result.data.files.map(async (file) => {
    const encryptedId = await encryptString(file.id);
    const encryptedDriveId = file.driveId ? await encryptString(file.driveId) : '';
    const link = await generateDownloadLink(file.id, userIp);
    return { ...file, id: encryptedId, driveId: encryptedDriveId, link };
  }));

  return jsonResponse({ ...result, data: { files: encryptedFiles } });
}

async function handleId2Path(request: Request, drive: GoogleDrive): Promise<Response> {
  const body = await request.json() as { id: string };
  const decryptedId = await decryptString(body.id);
  const result = await drive.findPathById(decryptedId);
  
  if (!result) {
    return jsonResponse({ error: 'Path not found' }, 404);
  }

  const [path, prefix] = result;
  return jsonResponse({ path: `/${prefix}:${path}` });
}

async function handleFallback(request: Request, drive: GoogleDrive, userIp: string): Promise<Response> {
  const body = await request.json() as ListRequestBody;
  const decryptedId = await decryptString(body.id || '');

  if (body.type === 'folder') {
    const result = await drive.listFilesById(decryptedId, body.page_token || undefined, body.page_index || 0);
    const encryptedFiles = await Promise.all(result.data.files.map(async (file) => {
      const encryptedId = await encryptString(file.id);
      const encryptedDriveId = file.driveId ? await encryptString(file.driveId) : '';
      const link = file.mimeType !== 'application/vnd.google-apps.folder'
        ? await generateDownloadLink(file.id, userIp)
        : undefined;
      return { ...file, id: encryptedId, driveId: encryptedDriveId, link };
    }));
    return jsonResponse({ ...result, data: { files: encryptedFiles } });
  }

  const file = await drive.findItemById(decryptedId);
  if (!file) {
    return jsonResponse({ error: 'File not found' }, 404);
  }

  const link = await generateDownloadLink(file.id, userIp);
  const encryptedId = await encryptString(file.id);
  return jsonResponse({ ...file, id: encryptedId, link, parents: [null] });
}

async function handleFindPath(request: Request, drive: GoogleDrive, url: URL): Promise<Response> {
  const id = url.searchParams.get('id');
  const view = url.searchParams.get('view') === 'true';

  if (!id) {
    return htmlResponse(getErrorHTML(400, 'Missing ID'), 400);
  }

  try {
    const result = await drive.findPathById(id);
    if (!result) {
      const encryptedId = await encryptString(id);
      return redirectResponse(`/fallback?id=${encryptedId}`);
    }

    const [path, prefix] = result;
    const fullPath = `/${prefix}:${path}${view ? '?a=view' : ''}`;
    return redirectResponse(fullPath);
  } catch {
    const encryptedId = await encryptString(id);
    return redirectResponse(`/fallback?id=${encryptedId}`);
  }
}
