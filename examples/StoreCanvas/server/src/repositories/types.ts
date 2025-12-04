export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  platforms: string[];
  brandKit: Record<string, unknown>;
  defaultScreenshotBackgroundStyle?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DesignType =
  | 'feature_graphic'
  | 'phone_screenshot'
  | 'tablet_screenshot'
  | 'app_icon_layout'
  | 'custom';

export type DesignStatus = 'draft' | 'ready' | 'archived';

export interface LayerBase {
  id: string;
  type: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  zIndex?: number;
  opacity?: number;
  source?: unknown;
}

export interface Design {
  id: string;
  projectId: string;
  name: string;
  type: DesignType;
  baseWidth: number;
  baseHeight: number;
  layers: LayerBase[];
  aiMetadata?: Record<string, unknown>;
  status: DesignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SizePreset {
  id: string;
  code: string;
  store: 'apple_app_store' | 'google_play';
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
  format: 'png' | 'jpeg';
  category: 'screenshot' | 'feature_graphic' | 'tv_banner' | 'icon';
}

export interface AssetExport {
  id: string;
  designId: string;
  sizePresetId: string;
  store: 'apple_app_store' | 'google_play';
  outputUrl: string;
  format: 'png' | 'jpeg';
  width: number;
  height: number;
  createdAt: Date;
  generatedByJobId?: string;
}

export type UploadType = 'logo' | 'screenshot' | 'background' | 'other';

export interface Upload {
  id: string;
  userId: string;
  projectId?: string;
  name?: string;
  type: UploadType;
  storageKey: string;
  url: string;
  format?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: Date;
}
