'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { SIZE_PRESETS } from '@/lib/presets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Monitor, Smartphone, LayoutTemplate, Ruler, CheckCircle2 } from 'lucide-react';

export default function NewDesignPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'phone_screenshot' as 'feature_graphic' | 'phone_screenshot' | 'tablet_screenshot' | 'app_icon_layout' | 'custom',
    baseOrientation: 'portrait' as 'portrait' | 'landscape',
    baseWidth: 1290,
    baseHeight: 2796,
    selectedPresets: [] as string[],
  });

  const handlePresetToggle = (presetCode: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPresets: prev.selectedPresets.includes(presetCode)
        ? prev.selectedPresets.filter((p) => p !== presetCode)
        : [...prev.selectedPresets, presetCode],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const design = await apiClient.createDesign(params.projectId, {
        name: formData.name,
        type: formData.type,
        baseWidth: formData.baseWidth,
        baseHeight: formData.baseHeight,
        baseOrientation: formData.baseOrientation,
        presets: formData.selectedPresets,
      });

      router.push(`/designs/${design.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create design');
      setLoading(false);
    }
  };

  const appStorePresets = SIZE_PRESETS.filter((p) => p.store === 'app_store');
  const playStorePresets = SIZE_PRESETS.filter((p) => p.store === 'google_play');

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        <div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" /> New Design
            </p>
            <h1 className="text-3xl font-bold font-['Libertinus_Sans_Regular']">Blueprint your next asset</h1>
            <p className="text-muted-foreground">
              Pick a base canvas, orientation, and export presets for the stores you ship to.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 border text-sm">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              Flexible canvas
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 border text-sm">
              <Ruler className="h-4 w-4 text-primary" />
              Store presets
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Design setup</CardTitle>
                <CardDescription>Name, type, orientation, and base canvas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Design name</Label>
                  <Input
                    id="name"
                    placeholder="My Screenshot Design"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone_screenshot">Phone Screenshot</SelectItem>
                      <SelectItem value="tablet_screenshot">Tablet Screenshot</SelectItem>
                      <SelectItem value="feature_graphic">Feature Graphic</SelectItem>
                      <SelectItem value="app_icon_layout">App Icon Layout</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Base orientation</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: 'portrait', label: 'Portrait', icon: Smartphone, width: 1290, height: 2796 },
                      { value: 'landscape', label: 'Landscape', icon: Monitor, width: 2796, height: 1290 },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = formData.baseOrientation === opt.value;
                      return (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          className="justify-start gap-2"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              baseOrientation: opt.value as 'portrait' | 'landscape',
                              baseWidth: opt.width,
                              baseHeight: opt.height,
                            })
                          }
                          disabled={loading}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                          {active && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseWidth">Base Width (px)</Label>
                    <Input
                      id="baseWidth"
                      type="number"
                      value={formData.baseWidth}
                      onChange={(e) => setFormData({ ...formData, baseWidth: parseInt(e.target.value) })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseHeight">Base Height (px)</Label>
                    <Input
                      id="baseHeight"
                      type="number"
                      value={formData.baseHeight}
                      onChange={(e) => setFormData({ ...formData, baseHeight: parseInt(e.target.value) })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export presets</CardTitle>
                <CardDescription>Pick the store sizes to generate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">App Store</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const codes = appStorePresets.map((p) => p.code);
                      setFormData((prev) => ({
                        ...prev,
                        selectedPresets: Array.from(new Set([...prev.selectedPresets, ...codes])),
                      }));
                    }}
                  >
                    Select all
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {appStorePresets.map((preset) => (
                    <Button
                      key={preset.code}
                      type="button"
                      variant={formData.selectedPresets.includes(preset.code) ? 'default' : 'outline'}
                      className="justify-start gap-2"
                      onClick={() => handlePresetToggle(preset.code)}
                      disabled={loading}
                    >
                      {formData.selectedPresets.includes(preset.code) ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border" />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{preset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {preset.width} × {preset.height}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Google Play Store</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const codes = playStorePresets.map((p) => p.code);
                      setFormData((prev) => ({
                        ...prev,
                        selectedPresets: Array.from(new Set([...prev.selectedPresets, ...codes])),
                      }));
                    }}
                  >
                    Select all
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {playStorePresets.map((preset) => (
                    <Button
                      key={preset.code}
                      type="button"
                      variant={formData.selectedPresets.includes(preset.code) ? 'default' : 'outline'}
                      className="justify-start gap-2"
                      onClick={() => handlePresetToggle(preset.code)}
                      disabled={loading}
                    >
                      {formData.selectedPresets.includes(preset.code) ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border" />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{preset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {preset.width} × {preset.height}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
                {loading ? 'Creating...' : 'Create Design'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                size="lg"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Quick glance at your setup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{formData.name || 'Untitled design'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-foreground capitalize">{formData.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.baseOrientation === 'portrait' ? (
                    <Smartphone className="h-4 w-4 text-primary" />
                  ) : (
                    <Monitor className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-foreground">{formData.baseWidth} × {formData.baseHeight}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{formData.selectedPresets.length} preset(s) selected</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
