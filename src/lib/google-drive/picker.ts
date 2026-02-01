/**
 * Google Picker API Integration
 * Provides a native Google Drive file picker for selecting VectorFlow project files.
 */

const PICKER_API_KEY = ''; // Not needed when using OAuth
const PICKER_SCOPE = 'https://www.googleapis.com/auth/drive';

export interface PickerFile {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
}

/**
 * Loads the Google Picker API script dynamically.
 */
function loadPickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.picker) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('picker', {
        callback: () => resolve(),
        onerror: () => reject(new Error('Failed to load Google Picker API')),
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.head.appendChild(script);
  });
}

/**
 * Creates and displays the Google Picker dialog.
 */
export async function showDrivePicker(
  accessToken: string,
  onSelect: (file: PickerFile) => void,
  onCancel?: () => void,
  mode: 'file' | 'folder' = 'file'
): Promise<void> {
  try {
    await loadPickerApi();

    const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
    const sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS);
    const sharedDrivesView = new google.picker.DocsView(); // No ViewId for Shared Drives root

    if (mode === 'folder') {
        view.setIncludeFolders(true)
            .setSelectFolderEnabled(true)
            .setMimeTypes('application/vnd.google-apps.folder');
        
        sharedView.setIncludeFolders(true)
            .setSelectFolderEnabled(true)
            .setMimeTypes('application/vnd.google-apps.folder')
            .setOwnedByMe(false);

        sharedDrivesView.setEnableDrives(true)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(true)
            .setMimeTypes('application/vnd.google-apps.folder');

    } else {
        view.setMimeTypes('application/json')
            .setIncludeFolders(true);
        
        sharedView.setMimeTypes('application/json')
            .setIncludeFolders(true)
            .setOwnedByMe(false);
            
        sharedDrivesView.setMimeTypes('application/json')
            .setEnableDrives(true)
            .setIncludeFolders(true);
    }

    const picker = new google.picker.PickerBuilder()
      // Add view for user's Drive files
      .addView(view)
      // Add view for "Shared with me"
      .addView(sharedView)
      // Add view for Shared Drives
      .addView(sharedDrivesView)
      .setOAuthToken(accessToken)
      .setDeveloperKey(PICKER_API_KEY) // Empty string is fine with OAuth
      .setCallback((data: google.picker.ResponseObject) => {
        if (data.action === google.picker.Action.PICKED && data.docs && data.docs.length > 0) {
          const doc = data.docs[0];
          onSelect({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url,
          });
        } else if (data.action === google.picker.Action.CANCEL) {
          onCancel?.();
        }
      })
      .setTitle(mode === 'folder' ? 'Select Destination Folder' : 'Select VectorFlow Project')
      .setSize(1051, 650)
      .build();

    picker.setVisible(true);
  } catch (error) {
    console.error('Failed to show picker:', error);
    throw error;
  }
}

/**
 * Hook for using the Google Drive Picker in React components.
 */
export function useDrivePicker(accessToken: string | null) {
  const openPicker = async (
    onSelect: (file: PickerFile) => void,
    onCancel?: () => void,
    mode: 'file' | 'folder' = 'file'
  ) => {
    if (!accessToken) {
      throw new Error('No access token available. Please sign in with Google.');
    }

    await showDrivePicker(accessToken, onSelect, onCancel, mode);
  };

  return { openPicker };
}
