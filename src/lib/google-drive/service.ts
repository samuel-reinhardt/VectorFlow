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

  static setAccessToken(token: string) {
    this.accessToken = token;
    // Also cache in sessionStorage for page refreshes during session
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('google_drive_access_token', token);
    }
  }

  static getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = window.sessionStorage.getItem('google_drive_access_token');
    }
    return this.accessToken;
  }

  /**
   * Creates a new file on Google Drive.
   */
  static async createFile(name: string, data: ExportData): Promise<string> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const metadata = {
      name,
      mimeType: 'application/json',
      description: 'VectorFlow Project Export',
      appProperties: {
          app: 'VectorFlow',
          type: 'project',
          projectId: data.projectId
      }
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    const response = await fetch(`${UPLOAD_API_URL}/files?uploadType=multipart`, {
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

    const response = await fetch(`${UPLOAD_API_URL}/files/${fileId}?uploadType=multipart`, {
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

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?fields=id,name,mimeType,modifiedTime`, {
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
   * Downloads the content of a file from Google Drive.
   */
  static async getFileContent(fileId: string): Promise<ExportData> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
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
   * Lists VectorFlow JSON files from the user's Drive.
   */
  static async listFiles(): Promise<DriveFile[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated with Google Drive');

    const query = encodeURIComponent("mimeType = 'application/json' and trashed = false and fullText contains 'VectorFlow'");
    const response = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id, name, mimeType, modifiedTime)&orderBy=modifiedTime desc`, {
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
      return response.ok;
    } catch {
      return false;
    }
  }
}
