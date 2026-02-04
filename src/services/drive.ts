/**
 * Google Drive API Module
 * @version 3.0.0
 */

import { config } from '../config';
import { generateGCPToken } from '../utils/crypto';
import { buildQueryString, retry } from '../utils/helpers';
import type { DriveFile, DriveListResponse, DriveSearchResult, DriveRootType } from '../types';
import { DEFAULT_FILE_FIELDS, FOLDER_MIME_TYPE } from '../types';

// Access token cache
let accessToken: string | undefined;
let tokenExpiry: number | undefined;

/**
 * Get OAuth2 access token
 */
export async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
    return accessToken;
  }

  const tokenData = await fetchAccessToken();
  if (tokenData.access_token) {
    accessToken = tokenData.access_token;
    tokenExpiry = Date.now() + 3500 * 1000;
  }

  return accessToken!;
}

async function fetchAccessToken(): Promise<{ access_token?: string }> {
  const url = 'https://www.googleapis.com/oauth2/v4/token';
  let postData: Record<string, string>;

  if (config.auth.service_account && config.auth.service_account_json) {
    const jwtToken = await generateGCPToken(config.auth.service_account_json);
    postData = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken
    };
  } else {
    postData = {
      client_id: config.auth.client_id,
      client_secret: config.auth.client_secret,
      refresh_token: config.auth.refresh_token,
      grant_type: 'refresh_token'
    };
  }

  const response = await retry(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: buildQueryString(postData)
    });
    if (!res.ok) throw new Error('Token fetch failed');
    return res;
  });

  return response.json();
}

async function driveRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = {
    ...options.headers as Record<string, string>,
    Authorization: `Bearer ${token}`
  };

  return retry(async () => {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok && res.status !== 404) throw new Error(`API error: ${res.status}`);
    return res;
  });
}

/**
 * Google Drive instance for a specific root
 */
export class GoogleDrive {
  public order: number;
  public root: { id: string; name: string; protect_file_link: boolean };
  public root_type: DriveRootType = 0;
  public url_path_prefix: string;
  
  private paths: Record<string, string> = {};
  private files: Record<string, DriveFile> = {};
  private childrenCache: Record<string, Array<{ nextPageToken: string | null; data: { files: DriveFile[] } }>> = {};

  constructor(order: number) {
    this.order = order;
    const rootConfig = config.auth.roots[order];
    this.root = {
      id: rootConfig.id,
      name: rootConfig.name,
      protect_file_link: rootConfig.protect_file_link || false
    };
    this.url_path_prefix = `/${order}:`;
    this.paths['/'] = this.root.id;
  }

  async init(): Promise<void> {
    await getAccessToken();
    if (!config.auth.user_drive_real_root_id) {
      const rootObj = await this.findItemById('root');
      if (rootObj?.id) {
        config.auth.user_drive_real_root_id = rootObj.id;
      }
    }
  }

  async initRootType(): Promise<void> {
    const rootId = this.root.id;
    if (rootId === 'root' || rootId === config.auth.user_drive_real_root_id) {
      this.root_type = 0; // USER_DRIVE
    } else {
      this.root_type = 1; // SHARE_DRIVE
    }
  }

  async findItemById(id: string): Promise<DriveFile | null> {
    const isUserDrive = this.root_type === 0;
    const url = `https://www.googleapis.com/drive/v3/files/${id}?fields=${DEFAULT_FILE_FIELDS}${isUserDrive ? '' : '&supportsAllDrives=true'}`;
    
    const res = await driveRequest(url);
    if (!res.ok) return null;
    return res.json();
  }

  async findPathId(path: string): Promise<string | undefined> {
    let currentPath = '/';
    let currentId = this.paths[currentPath];

    const parts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    
    for (const name of parts) {
      currentPath += name + '/';
      if (!this.paths[currentPath]) {
        const id = await this.findDirId(currentId, name);
        if (id) this.paths[currentPath] = id;
      }
      currentId = this.paths[currentPath];
      if (!currentId) break;
    }

    return this.paths[path];
  }

  private async findDirId(parent: string, name: string): Promise<string | null> {
    if (!parent) return null;
    
    const decodedName = decodeURIComponent(name).replace(/'/g, "\\'");
    const params = {
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      q: `'${parent}' in parents and mimeType = '${FOLDER_MIME_TYPE}' and name = '${decodedName}' and trashed = false`,
      fields: 'files(id,name,mimeType)'
    };

    const url = `https://www.googleapis.com/drive/v3/files?${buildQueryString(params)}`;
    const res = await driveRequest(url);
    const data = await res.json() as { files: DriveFile[] };
    
    return data.files?.[0]?.id || null;
  }

  async getSingleFile(path: string): Promise<DriveFile | null> {
    if (this.files[path]) return this.files[path];
    
    const file = await this.getSingleFileApi(path);
    if (file) this.files[path] = file;
    return file;
  }

  private async getSingleFileApi(path: string): Promise<DriveFile | null> {
    const parts = path.split('/');
    let name = parts.pop() || '';
    name = decodeURIComponent(name).replace(/'/g, "\\'");
    const dir = parts.join('/') + '/';
    
    const parent = await this.findPathId(dir);
    if (!parent) return null;

    const params = {
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      q: `'${parent}' in parents and name = '${name}' and trashed = false and mimeType != 'application/vnd.google-apps.shortcut'`,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,iconLink,thumbnailLink,driveId,fileExtension)'
    };

    const url = `https://www.googleapis.com/drive/v3/files?${buildQueryString(params)}`;
    const res = await driveRequest(url);
    const data = await res.json() as { files: DriveFile[] };
    
    return data.files?.[0] || null;
  }

  async listFiles(path: string, pageToken?: string, pageIndex: number = 0): Promise<DriveListResponse> {
    // Check cache
    if (this.childrenCache[path]?.[pageIndex]?.data) {
      const cached = this.childrenCache[path][pageIndex];
      return { nextPageToken: cached.nextPageToken, curPageIndex: pageIndex, data: cached.data };
    }

    const id = await this.findPathId(path);
    if (!id) return { nextPageToken: null, curPageIndex: pageIndex, data: { files: [] } };

    return this.listFilesById(id, pageToken, pageIndex);
  }

  async listFilesById(parentId: string, pageToken?: string, pageIndex: number = 0): Promise<DriveListResponse> {
    const params: Record<string, string> = {
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      q: `'${parentId}' in parents and trashed = false AND name !='.password' and mimeType != 'application/vnd.google-apps.shortcut'`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,driveId,kind,fileExtension)',
      pageSize: String(config.auth.files_list_page_size)
    };

    if (pageToken) params.pageToken = pageToken;

    const url = `https://www.googleapis.com/drive/v3/files?${buildQueryString(params)}`;
    const res = await driveRequest(url);
    const data = await res.json() as { files: DriveFile[]; nextPageToken?: string };

    return {
      nextPageToken: data.nextPageToken || null,
      curPageIndex: pageIndex,
      data: { files: data.files || [] }
    };
  }

  async search(keyword: string, pageToken?: string, pageIndex: number = 0): Promise<DriveSearchResult> {
    const formatted = keyword.replace(/(!=)|['"=<>/\\:]/g, '').replace(/[,，|(){}]/g, ' ').trim();
    if (!formatted) return { nextPageToken: null, curPageIndex: pageIndex, data: null };

    const words = formatted.split(/\s+/);
    const nameSearch = `name contains '${words.join("' AND name contains '")}'`;

    const params: Record<string, string> = {
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      q: `trashed = false AND name !='.password' AND (${nameSearch})`,
      fields: 'nextPageToken,files(id,driveId,name,mimeType,size,modifiedTime)',
      pageSize: String(config.auth.search_result_list_page_size),
      orderBy: 'folder,name,modifiedTime desc'
    };

    if (config.auth.search_all_drives) {
      params.corpora = 'allDrives';
    } else if (this.root_type === 1) {
      params.corpora = 'drive';
      params.driveId = this.root.id;
    } else {
      params.corpora = 'user';
    }

    if (pageToken) params.pageToken = pageToken;

    const url = `https://www.googleapis.com/drive/v3/files?${buildQueryString(params)}`;
    const res = await driveRequest(url);
    const data = await res.json() as { files: DriveFile[]; nextPageToken?: string };

    return {
      nextPageToken: data.nextPageToken || null,
      curPageIndex: pageIndex,
      data: { files: data.files || [] }
    };
  }

  async findPathById(childId: string): Promise<[string, number] | null> {
    const driveList = config.auth.roots.map(r => r.id);
    const parentFiles: DriveFile[] = [];
    let driveIndex = 0;
    let meetTop = false;

    const addParent = async (file: DriveFile): Promise<void> => {
      if (!file?.parents?.length) return;
      
      const parentId = file.parents[0];
      if (driveList.includes(parentId)) {
        meetTop = true;
        driveIndex = driveList.indexOf(parentId);
        return;
      }

      const parentFile = await this.findItemById(parentId);
      if (parentFile?.id) {
        parentFiles.push(parentFile);
        await addParent(parentFile);
      }
    };

    const childObj = await this.findItemById(childId);
    if (!childObj) return null;
    
    parentFiles.push(childObj);
    await addParent(childObj);

    if (!meetTop || parentFiles.length < 1) return null;

    const path = '/' + parentFiles.map(f => encodeURIComponent(f.name)).reverse().join('/');
    const isFolder = childObj.mimeType === FOLDER_MIME_TYPE;
    
    return [isFolder ? path + '/' : path, driveIndex];
  }
}

// Drive instances cache
const driveInstances: GoogleDrive[] = [];

export async function initDrives(): Promise<GoogleDrive[]> {
  if (driveInstances.length > 0) return driveInstances;

  try {
    for (let i = 0; i < config.auth.roots.length; i++) {
      const drive = new GoogleDrive(i);
      await drive.init();
      driveInstances.push(drive);
    }

    await Promise.all(driveInstances.map(d => d.initRootType()));
    return driveInstances;
  } catch (error) {
    console.error('Failed to initialize drives:', error);
    throw new Error(`Drive initialization failed: ${(error as Error).message}`);
  }
}

export function getDrive(index: number): GoogleDrive | undefined {
  return driveInstances[index];
}

export function getAllDrives(): GoogleDrive[] {
  return driveInstances;
}
