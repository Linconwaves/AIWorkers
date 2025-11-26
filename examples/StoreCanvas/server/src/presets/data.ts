import { SizePreset } from '../repositories/types';

export const SIZE_PRESETS: SizePreset[] = [
  {
    id: 'apple-iphone-6-7-portrait',
    code: 'apple_iphone_6_7_portrait',
    store: 'apple_app_store',
    label: 'Apple iPhone 6.7" Portrait',
    width: 1290,
    height: 2796,
    aspectRatio: 1290 / 2796,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'apple-iphone-6-7-landscape',
    code: 'apple_iphone_6_7_landscape',
    store: 'apple_app_store',
    label: 'Apple iPhone 6.7" Landscape',
    width: 2796,
    height: 1290,
    aspectRatio: 2796 / 1290,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'apple-iphone-6-5-portrait',
    code: 'apple_iphone_6_5_portrait',
    store: 'apple_app_store',
    label: 'Apple iPhone 6.5" Portrait',
    width: 1284,
    height: 2778,
    aspectRatio: 1284 / 2778,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'apple-iphone-6-5-landscape',
    code: 'apple_iphone_6_5_landscape',
    store: 'apple_app_store',
    label: 'Apple iPhone 6.5" Landscape',
    width: 2778,
    height: 1284,
    aspectRatio: 2778 / 1284,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'apple-iphone-5-5-portrait',
    code: 'apple_iphone_5_5_portrait',
    store: 'apple_app_store',
    label: 'Apple iPhone 5.5" Portrait',
    width: 1242,
    height: 2208,
    aspectRatio: 1242 / 2208,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'apple-iphone-5-5-landscape',
    code: 'apple_iphone_5_5_landscape',
    store: 'apple_app_store',
    label: 'Apple iPhone 5.5" Landscape',
    width: 2208,
    height: 1242,
    aspectRatio: 2208 / 1242,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'apple-ipad-12-9-portrait',
    code: 'apple_ipad_12_9_portrait',
    store: 'apple_app_store',
    label: 'Apple iPad 12.9\" Portrait',
    width: 2048,
    height: 2732,
    aspectRatio: 2048 / 2732,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'apple-ipad-12-9-landscape',
    code: 'apple_ipad_12_9_landscape',
    store: 'apple_app_store',
    label: 'Apple iPad 12.9\" Landscape',
    width: 2732,
    height: 2048,
    aspectRatio: 2732 / 2048,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'google-play-feature-graphic',
    code: 'google_play_feature_graphic',
    store: 'google_play',
    label: 'Google Play Feature Graphic',
    width: 1024,
    height: 500,
    aspectRatio: 1024 / 500,
    format: 'jpeg',
    category: 'feature_graphic'
  },
  {
    id: 'google-play-phone-screenshot',
    code: 'google_play_phone_screenshot',
    store: 'google_play',
    label: 'Google Play Phone Screenshot',
    width: 1080,
    height: 2160,
    aspectRatio: 1080 / 2160,
    format: 'png',
    category: 'screenshot'
  },
  {
    id: 'google-play-icon',
    code: 'google_play_icon',
    store: 'google_play',
    label: 'Google Play App Icon Helper',
    width: 512,
    height: 512,
    aspectRatio: 1,
    format: 'png',
    category: 'icon'
  }
];
