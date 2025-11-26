import { SizePreset } from './types';

export const SIZE_PRESETS: SizePreset[] = [
  {
    code: 'iphone_67_portrait',
    name: 'iPhone 6.7" Portrait',
    width: 1290,
    height: 2796,
    store: 'app_store',
    category: 'phone',
  },
  {
    code: 'iphone_67_landscape',
    name: 'iPhone 6.7" Landscape',
    width: 2796,
    height: 1290,
    store: 'app_store',
    category: 'phone',
  },
  {
    code: 'iphone_65_portrait',
    name: 'iPhone 6.5" Portrait',
    width: 1242,
    height: 2688,
    store: 'app_store',
    category: 'phone',
  },
  {
    code: 'iphone_65_landscape',
    name: 'iPhone 6.5" Landscape',
    width: 2688,
    height: 1242,
    store: 'app_store',
    category: 'phone',
  },
  {
    code: 'iphone_55_portrait',
    name: 'iPhone 5.5" Portrait',
    width: 1242,
    height: 2208,
    store: 'app_store',
    category: 'phone',
  },
  {
    code: 'iphone_55_landscape',
    name: 'iPhone 5.5" Landscape',
    width: 2208,
    height: 1242,
    store: 'app_store',
    category: 'phone',
  },
  {
    code: 'ipad_129_portrait',
    name: 'iPad 12.9" Portrait',
    width: 2048,
    height: 2732,
    store: 'app_store',
    category: 'tablet',
  },
  {
    code: 'ipad_129_landscape',
    name: 'iPad 12.9" Landscape',
    width: 2732,
    height: 2048,
    store: 'app_store',
    category: 'tablet',
  },
  {
    code: 'google_play_feature',
    name: 'Google Play Feature Graphic',
    width: 1024,
    height: 500,
    store: 'google_play',
    category: 'feature_graphic',
  },
  {
    code: 'google_play_phone_portrait',
    name: 'Google Play Phone Portrait',
    width: 1080,
    height: 1920,
    store: 'google_play',
    category: 'phone',
  },
  {
    code: 'google_play_phone_landscape',
    name: 'Google Play Phone Landscape',
    width: 1920,
    height: 1080,
    store: 'google_play',
    category: 'phone',
  },
  {
    code: 'google_play_tablet_portrait',
    name: 'Google Play Tablet Portrait',
    width: 1600,
    height: 2560,
    store: 'google_play',
    category: 'tablet',
  },
  {
    code: 'google_play_tablet_landscape',
    name: 'Google Play Tablet Landscape',
    width: 2560,
    height: 1600,
    store: 'google_play',
    category: 'tablet',
  },
];

export function getPresetByCode(code: string): SizePreset | undefined {
  return SIZE_PRESETS.find((p) => p.code === code);
}

export function getPresetsByStore(store: 'app_store' | 'google_play'): SizePreset[] {
  return SIZE_PRESETS.filter((p) => p.store === store);
}

export function getPresetsByOrientation(orientation: 'portrait' | 'landscape'): SizePreset[] {
  return SIZE_PRESETS.filter((p) =>
    orientation === 'portrait' ? p.height > p.width : p.width > p.height
  );
}
