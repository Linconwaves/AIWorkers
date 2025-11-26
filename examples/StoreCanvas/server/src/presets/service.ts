import { SizePreset } from '../repositories/types';
import { SIZE_PRESETS } from './data';
import { ValidationError } from '../common/errors';

export class PresetService {
  listPresets(store?: string, category?: string): SizePreset[] {
    return SIZE_PRESETS.filter((preset) => {
      const storeMatch = store ? preset.store === store : true;
      const categoryMatch = category ? preset.category === category : true;
      return storeMatch && categoryMatch;
    });
  }

  getByCodes(codes: string[]): SizePreset[] {
    const presets: SizePreset[] = [];
    for (const code of codes) {
      const preset = SIZE_PRESETS.find((p) => p.code === code);
      if (!preset) throw new ValidationError(`Unknown size preset: ${code}`);
      presets.push(preset);
    }
    return presets;
  }

  validateExport(
    preset: SizePreset,
    baseWidth: number,
    baseHeight: number,
    format: 'png' | 'jpeg'
  ) {
    if (format !== 'png' && format !== 'jpeg') {
      throw new ValidationError('Invalid format; must be png or jpeg');
    }
    if (preset.store === 'apple_app_store') {
      if (preset.width > baseWidth || preset.height > baseHeight) {
        throw new ValidationError('Base design is smaller than target preset size');
      }
    }

    if (preset.store === 'google_play') {
      const min = Math.min(preset.width, preset.height);
      const max = Math.max(preset.width, preset.height);
      if (min < 320 || max > 3840) {
        throw new ValidationError('Google Play screenshots must be between 320px and 3840px');
      }
      if (max > 2 * min) {
        throw new ValidationError('Google Play screenshots must have an aspect ratio up to 2:1');
      }
      if (preset.category === 'feature_graphic' && format === 'png') {
        // still allowed if 24-bit PNG without alpha; leaving as informational check.
      }
    }
  }
}
