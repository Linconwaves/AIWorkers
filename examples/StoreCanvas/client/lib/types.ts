export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  platforms: string[];
  brandKit: Record<string, unknown>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Design {
  id: string;
  projectId: string;
  name: string;
  type:
    | 'feature_graphic'
    | 'phone_screenshot'
    | 'tablet_screenshot'
    | 'app_icon_layout'
    | 'custom';
  baseWidth: number;
  baseHeight: number;
  layers: Layer[];
  status: 'draft' | 'ready' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Layer {
  id: string;
  type: 'background' | 'image' | 'logo' | 'text' | 'shape' | 'overlay' | string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  data?: BackgroundLayer | ImageLayer | LogoLayer | TextLayer | ShapeLayer | Record<string, unknown>;
  source?: string;
}

export interface BackgroundLayer {
  type: 'solid' | 'gradient';
  color?: string;
  gradient?: {
    colors: string[];
    angle: number;
    stops: number[];
  };
}

export interface ImageLayer {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  cropMode?: 'cover' | 'contain' | 'fill';
  shadow?: boolean;
}

export interface LogoLayer {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  glow?: boolean;
  shadow?: boolean;
}

export interface TextLayer {
  content: string;
  x: number;
  y: number;
  width?: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  align: 'left' | 'center' | 'right';
}

export interface ShapeLayer {
  shape: 'rectangle' | 'circle' | 'rounded-rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fillColor: string;
  borderRadius?: number;
  opacity: number;
  blur?: number;
  shadow?: boolean;
}

export interface SizePreset {
  id: string;
  code: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
  store: 'apple_app_store' | 'google_play';
  format: 'png' | 'jpeg';
  category: 'screenshot' | 'feature_graphic' | 'tv_banner' | 'icon';
}

export interface Export {
  id: string;
  designId: string;
  sizePresetId: string;
  store: 'apple_app_store' | 'google_play';
  format: 'png' | 'jpeg';
  width: number;
  height: number;
  outputUrl?: string;
  createdAt: string;
  generatedByJobId?: string;
}

export interface Upload {
  id: string;
  userId: string;
  projectId?: string;
  storageKey: string;
  url: string;
  name?: string;
  format?: string;
  mimeType?: string;
  type: 'logo' | 'screenshot' | 'background' | 'other';
  createdAt: string;
  width?: number;
  height?: number;
}
