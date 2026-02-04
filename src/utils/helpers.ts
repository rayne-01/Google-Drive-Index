/**
 * General Utility Functions
 * @version 3.0.0
 */

import { FILE_TYPES, type FileType, type FileTypeConfig } from '../types';

// ============================================================================
// File Type Detection
// ============================================================================

/**
 * Get the file type category based on extension
 */
export function getFileType(extension: string | undefined): FileType {
  if (!extension) return 'other';
  const ext = extension.toLowerCase();

  for (const [type, extensions] of Object.entries(FILE_TYPES) as [FileType, string[]][]) {
    if (extensions.includes(ext)) {
      return type;
    }
  }

  return 'other';
}

/**
 * Check if extension belongs to a specific file type
 */
export function isFileType(extension: string | undefined, type: keyof FileTypeConfig): boolean {
  if (!extension) return false;
  return FILE_TYPES[type]?.includes(extension.toLowerCase()) ?? false;
}

/**
 * Check if a MIME type indicates a folder
 */
export function isFolder(mimeType: string): boolean {
  return mimeType === 'application/vnd.google-apps.folder';
}

// ============================================================================
// File Size Formatting
// ============================================================================

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number | string | undefined): string {
  if (bytes === undefined || bytes === null || bytes === '') {
    return '';
  }

  const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

  if (isNaN(numBytes)) return '';

  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  const thresholds = [1, 1024, 1048576, 1073741824, 1099511627776];

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (numBytes >= thresholds[i]) {
      const value = numBytes / thresholds[i];
      if (i === 0) {
        return numBytes === 1 ? '1 byte' : `${numBytes} bytes`;
      }
      return `${value.toFixed(2)} ${units[i]}`;
    }
  }

  return '';
}

// ============================================================================
// Date/Time Formatting
// ============================================================================

/**
 * Convert UTC datetime to local time (IST/Delhi timezone)
 */
export function utcToLocal(utcDatetime: string, offsetHours: number = 5.5): string {
  const utcDate = new Date(utcDatetime);
  const localDate = new Date(utcDate.getTime() + offsetHours * 60 * 60 * 1000);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const date = String(localDate.getDate()).padStart(2, '0');
  const hour = String(localDate.getHours()).padStart(2, '0');
  const minute = String(localDate.getMinutes()).padStart(2, '0');
  const second = String(localDate.getSeconds()).padStart(2, '0');

  return `${date}-${month}-${year} ${hour}:${minute}:${second}`;
}

/**
 * Format date for display (shorter format)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ============================================================================
// URL/Path Utilities
// ============================================================================

/**
 * Encode URI component with special character handling
 */
export function safeEncodeURIComponent(str: string): string {
  return encodeURIComponent(str)
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F')
    .replace(/\//g, '%2F');
}

/**
 * Trim characters from string (like PHP's trim)
 */
export function trimChar(str: string, char?: string): string {
  if (char) {
    return str.replace(new RegExp(`^\\${char}+|\\${char}+$`, 'g'), '');
  }
  return str.replace(/^\s+|\s+$/g, '');
}

/**
 * Parse path to get folder and filename
 */
export function parsePath(path: string): { folder: string; filename: string } {
  const parts = trimChar(path, '/').split('/');
  const filename = parts.pop() || '';
  const folder = '/' + parts.join('/') + (parts.length > 0 ? '/' : '');
  return { folder, filename };
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join('&');
}

/**
 * Parse query string to object
 */
export function parseQueryString(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  const parts = query.replace(/^\?/, '').split('&');

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }

  return params;
}

// ============================================================================
// Search Utilities
// ============================================================================

/**
 * Format search keyword for Google Drive API
 */
export function formatSearchKeyword(keyword: string | undefined): string {
  if (!keyword) return '';

  return keyword
    .replace(/(!=)|['"=<>/\\:]/g, '')
    .replace(/[,，|(){}]/g, ' ')
    .trim();
}

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Parse cookies from header string
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  }

  return cookies;
}

/**
 * Build Set-Cookie header value
 */
export function buildCookie(
  name: string,
  value: string,
  options: {
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    maxAge?: number;
    expires?: Date;
  } = {}
): string {
  let cookie = `${name}=${value}`;

  if (options.path) cookie += `; Path=${options.path}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${options.maxAge}`;
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;

  return cookie;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create JSON response
 */
export function jsonResponse(
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

/**
 * Create HTML response
 */
export function htmlResponse(
  html: string,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...headers
    }
  });
}

/**
 * Create redirect response
 */
export function redirectResponse(
  url: string,
  status: number = 302,
  headers: Record<string, string> = {}
): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
      ...headers
    }
  });
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 800
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(baseDelay * (i + 1));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate Google Drive file/folder ID format
 */
export function isValidDriveId(id: string): boolean {
  // Google Drive IDs are typically 28-44 characters, alphanumeric with - and _
  return /^[a-zA-Z0-9_-]{10,50}$/.test(id) || id === 'root';
}

/**
 * Sanitize filename for display
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*]/g, '_');
}

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  getFileType,
  isFileType,
  isFolder,
  formatFileSize,
  utcToLocal,
  formatDate,
  safeEncodeURIComponent,
  trimChar,
  parsePath,
  buildQueryString,
  parseQueryString,
  formatSearchKeyword,
  parseCookies,
  buildCookie,
  jsonResponse,
  htmlResponse,
  redirectResponse,
  sleep,
  retry,
  isValidDriveId,
  sanitizeFilename
};
