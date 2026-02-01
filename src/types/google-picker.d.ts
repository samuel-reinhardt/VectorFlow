/**
 * TypeScript declarations for Google Picker API and GAPI
 */

declare global {
  interface Window {
    gapi: typeof gapi;
    google: typeof google;
  }

  const gapi: {
    load: (api: string, options: { callback: () => void; onerror?: () => void }) => void;
  };

  namespace google {
    namespace picker {
      enum ViewId {
        DOCS = 'all',
        DOCS_IMAGES = 'docs-images',
        DOCS_IMAGES_AND_VIDEOS = 'docs-images-and-videos',
        DOCS_VIDEOS = 'docs-videos',
        DOCUMENTS = 'documents',
        DRAWINGS = 'drawings',
        FOLDERS = 'folders',
        FORMS = 'forms',
        IMAGE_SEARCH = 'image-search',
        MAPS = 'maps',
        PDFS = 'pdfs',
        PHOTO_ALBUMS = 'photo-albums',
        PHOTO_UPLOAD = 'photo-upload',
        PHOTOS = 'photos',
        PRESENTATIONS = 'presentations',
        RECENTLY_PICKED = 'recently-picked',
        SPREADSHEETS = 'spreadsheets',
        VIDEO_SEARCH = 'video-search',
        WEBCAM = 'webcam',
        YOUTUBE = 'youtube',
      }

      enum Action {
        CANCEL = 'cancel',
        PICKED = 'picked',
        LOADED = 'loaded',
      }

      interface Document {
        id: string;
        name: string;
        mimeType: string;
        url?: string;
        description?: string;
        type?: string;
        lastEditedUtc?: number;
        iconUrl?: string;
        parentId?: string;
      }

      interface ResponseObject {
        action: Action;
        docs?: Document[];
        viewToken?: string[];
      }

      class DocsView {
        constructor(viewId?: ViewId);
        setIncludeFolders(include: boolean): DocsView;
        setMimeTypes(mimeTypes: string): DocsView;
        setOwnedByMe(owned: boolean): DocsView;
        setEnableDrives(enable: boolean): DocsView;
        setParent(parentId: string): DocsView;
        setSelectFolderEnabled(enabled: boolean): DocsView;
      }

      class PickerBuilder {
        addView(view: DocsView): PickerBuilder;
        setOAuthToken(token: string): PickerBuilder;
        setDeveloperKey(key: string): PickerBuilder;
        setCallback(callback: (data: ResponseObject) => void): PickerBuilder;
        setTitle(title: string): PickerBuilder;
        setSize(width: number, height: number): PickerBuilder;
        setOrigin(origin: string): PickerBuilder;
        setLocale(locale: string): PickerBuilder;
        enableFeature(feature: Feature): PickerBuilder;
        disableFeature(feature: Feature): PickerBuilder;
        build(): Picker;
      }

      interface Picker {
        setVisible(visible: boolean): void;
        dispose(): void;
      }

      enum Feature {
        MINE_ONLY = 'mineOnly',
        MULTISELECT_ENABLED = 'multiselectEnabled',
        NAV_HIDDEN = 'navHidden',
        SIMPLE_UPLOAD_ENABLED = 'simpleUploadEnabled',
        SUPPORT_DRIVES = 'supportDrives',
      }
    }
  }
}

export {};
