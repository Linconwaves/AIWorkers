import { describe, expect, it } from 'vitest';
import { PresetService } from '../src/presets/service';

describe('PresetService', () => {
  it('returns presets by code and validates dimensions', () => {
    const service = new PresetService();
    const presets = service.getByCodes(['apple_iphone_6_7_portrait']);
    expect(presets[0].width).toBe(1290);
    expect(() => service.validateExport(presets[0], 1200, 1200, 'png')).toThrow();
  });
});
