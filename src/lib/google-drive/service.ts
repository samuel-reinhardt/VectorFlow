'use client';

import { ExportData } from '../export-import';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

/**
 * Service for interacting with Google Drive API.
 * Handles file creation, updates, and content retrieval.
 */
export class GoogleDriveService {
  private static accessToken: string | null = null;

  private static listeners: ((token: string | null) => void)[] = [];

  private static STORAGE_KEY = 'google_drive_access_token';
  private static EXPIRY_KEY = 'google_drive_token_expiry';
  private static TOKEN_LIFESPAN = 3600 * 1000; // 1 hour in ms

  static setAccessToken(token: string) {
    this.accessToken = token;
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.STORAGE_KEY, token);
      // Set expiry to 55 minutes to be safe/proactive
      const expiry = Date.now() + (this.TOKEN_LIFESPAN - 5 * 60 * 1000); 
      window.localStorage.setItem(this.EXPIRY_KEY, expiry.toString());
    }
    
    this.notifyListeners();
  }

  static subscribe(listener: (token: string | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(l => l(this.accessToken));
  }

  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      this.accessToken = window.localStorage.getItem(this.STORAGE_KEY);
    }
    return this.accessToken;
  }

  static clearAccessToken() {
    this.accessToken = null;
    
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(this.STORAGE_KEY);
      window.localStorage.removeItem(this.EXPIRY_KEY);
    }
    
    this.notifyListeners();
  }

  /**
   * Creates a new file on Google Drive.
   */
  static async createFile(name: string, data: ExportData, folderId?: string): Promise<string> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const metadata: any = {
      name,
      mimeType: 'application/json',
      description: 'VectorFlow Project Export',
      appProperties: {
          app: 'VectorFlow',
          type: 'project',
          projectId: data.projectId
      }
    };

    if (folderId) {
        metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    const response = await fetch(`${UPLOAD_API_URL}/files?uploadType=multipart&supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create file: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Updates an existing file on Google Drive.
   */
  static async updateFile(fileId: string, data: ExportData): Promise<void> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const metadata = {
      name: `${data.projectName || 'vectorflow-project'}.json`,
      appProperties: {
          projectId: data.projectId
      }
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    const response = await fetch(`${UPLOAD_API_URL}/files/${fileId}?uploadType=multipart&supportsAllDrives=true`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update file: ${error.error?.message || response.statusText}`);
    }
  }

  /**
   * Gets file metadata by ID.
   */
  static async getFileById(fileId: string): Promise<DriveFile> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?fields=id,name,mimeType,modifiedTime&supportsAllDrives=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get file: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Gets lightweight file metadata for sync polling (doesn't download content).
   */
  static async getFileMetadata(fileId: string): Promise<{ modifiedTime: string; id: string; name: string }> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?fields=id,name,modifiedTime&supportsAllDrives=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get file metadata: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Gets the current user's permissions for a file.
   * Returns whether the user can edit the file.
   */
  static async getFilePermissions(fileId: string): Promise<{ canEdit: boolean }> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?fields=capabilities&supportsAllDrives=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get file permissions: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      canEdit: data.capabilities?.canEdit ?? false,
    };
  }

  /**
   * Downloads the content of a file from Google Drive.
   */
  static async getFileContent(fileId: string): Promise<ExportData> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media&supportsAllDrives=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to download file: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Attempts to download a public file without authentication.
   * Uses a server-side proxy to bypass CORS and API limitations.
   */
  static async downloadPublicFile(fileId: string): Promise<ExportData> {
    // Call our internal proxy which handles the upstream fetch server-side
    const response = await fetch(`/api/proxy-drive?fileId=${fileId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to download public file: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Lists VectorFlow JSON files from the user's Drive.
   */
  static async listFiles(): Promise<DriveFile[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const query = encodeURIComponent("mimeType = 'application/json' and trashed = false and fullText contains 'VectorFlow'");
    const response = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id, name, mimeType, modifiedTime)&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list files: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result.files;
  }

  /**
   * Checks if the current token is valid by performing a lightweight request.
   */
  static async validateToken(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${DRIVE_API_URL}/about?fields=user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok && response.status === 401) {
          this.clearAccessToken();
          return false;
      }
      
      return response.ok;
    } catch {
      return false;
    }
  }

  // Initialize service - meant to be called on app mount
  static initialize() {
      this.getAccessToken(); // Triggers load and expiry check
  }
}
