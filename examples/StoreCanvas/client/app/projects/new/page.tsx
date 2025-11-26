'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Sparkles, Smartphone, MonitorSmartphone, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

async function extractPalette(imageUrl: string): Promise<[string, string] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      const width = 64;
      const height = 64;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      const buckets: Record<string, number> = {};
      const step = 24; // coarse quantization for stability
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / step) * step;
        const g = Math.round(data[i + 1] / step) * step;
        const b = Math.round(data[i + 2] / step) * step;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const top = Object.entries(buckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([key]) => {
          const [r, g, b] = key.split(',').map((n) => Number(n));
          return `#${[r, g, b]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')}`;
        }) as [string, string?];
      resolve(top.length ? [top[0], top[1] ?? top[0]] : null);
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [logoUploadId, setLogoUploadId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    platforms: [] as string[],
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    fontFamily: 'Inter',
  });

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (logoUploadId) {
        await apiClient.deleteUpload(logoUploadId);
      }
      const upload = await apiClient.createUpload(file, 'logo');
      setLogoUploadId(upload.id);
      setFormData((prev) => ({ ...prev, logoUrl: upload.url }));
      const colors = await extractPalette(upload.url);
      if (colors) {
        setFormData((prev) => ({
          ...prev,
          primaryColor: colors[0],
          secondaryColor: colors[1] ?? prev.secondaryColor
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (logoUploadId) {
      try {
        await apiClient.deleteUpload(logoUploadId);
      } catch {
        // ignore cleanup error
      }
    }
    setLogoUploadId(null);
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.platforms.length === 0) {
      setError('Please select at least one platform');
      setLoading(false);
      return;
    }

    try {
      const project = await apiClient.createProject({
        name: formData.name,
        platforms: formData.platforms,
        brandKit: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: formData.logoUrl,
          fontFamily: formData.fontFamily,
        },
      });

      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        <div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-6 sm:p-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" /> New Project
            </p>
            <h1 className="text-3xl font-bold font-['Libertinus_Sans_Regular']">Set up your brand in minutes</h1>
            <p className="text-muted-foreground">
              Add platforms, brand colors, and a logo to generate ready-to-ship store assets.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 border text-sm">
              <Smartphone className="h-4 w-4 text-primary" />
              iOS / Android ready
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 border text-sm">
              <MonitorSmartphone className="h-4 w-4 text-primary" />
              Responsive canvas
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Project details</CardTitle>
                <CardDescription>Basic info to name and target your app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome App"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {[
                      { key: 'iOS', label: 'iOS (App Store)' },
                      { key: 'Android', label: 'Android (Play Store)' },
                    ].map((platform) => {
                      const active = formData.platforms.includes(platform.key);
                      return (
                        <Button
                          key={platform.key}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          className="justify-start gap-2 flex-1"
                          onClick={() => handlePlatformToggle(platform.key)}
                          disabled={loading}
                        >
                          {active ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          {platform.label}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pick at least one platform to tailor export presets.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Brand kit</CardTitle>
                <CardDescription>Colors, logo, and typography for consistent assets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        disabled={loading}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        disabled={loading}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo (optional)</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={loading || uploading}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : formData.logoUrl ? 'Replace logo' : 'Upload logo'}
                    </Button>
                    {formData.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={handleRemoveLogo}
                        disabled={loading || uploading}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {formData.logoUrl && (
                    <div className="mt-2 inline-flex items-center gap-3 rounded-md border p-2 bg-muted/50">
                      <div className="relative h-12 w-12 rounded overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.logoUrl} alt="Uploaded logo preview" className="h-full w-full object-contain" />
                      </div>
                      <span className="text-sm text-muted-foreground">Logo linked</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font family</Label>
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(val) => setFormData({ ...formData, fontFamily: val })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a font family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Manrope">Manrope</SelectItem>
                      <SelectItem value="Sora">Sora</SelectItem>
                      <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                      <SelectItem value="DM Sans">DM Sans</SelectItem>
                      <SelectItem value="Libre Baskerville">Libre Baskerville</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      <SelectItem value="Work Sans">Work Sans</SelectItem>
                      <SelectItem value="Nunito Sans">Nunito Sans</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
                {loading ? 'Creating...' : 'Create project'}
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
                <CardTitle>Brand preview</CardTitle>
                <CardDescription>Instant snapshot of your selections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="rounded-xl border overflow-hidden shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.secondaryColor} 100%)`
                  }}
                >
                  <div
                    className="p-4 bg-black/20 text-white"
                    style={{ fontFamily: `${formData.fontFamily}, Inter, sans-serif` }}
                  >
                    <div className="text-xs uppercase opacity-80">Palette</div>
                    <div className="text-lg font-semibold">{formData.name || 'Your project'}</div>
                    <div className="text-sm opacity-80 mt-1">
                      {formData.platforms.length ? formData.platforms.join(' · ') : 'Select platform'}
                    </div>
                  </div>
                  <div
                    className="grid grid-cols-2 divide-x divide-white/20 text-white"
                    style={{ fontFamily: `${formData.fontFamily}, Inter, sans-serif` }}
                  >
                    <div className="p-3 flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: formData.primaryColor }} />
                      <span className="text-sm">Primary</span>
                    </div>
                    <div className="p-3 flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: formData.secondaryColor }} />
                      <span className="text-sm">Secondary</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <div>Tips</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>High-contrast colors work best for screenshots.</li>
                    <li>Upload a transparent PNG logo for crisp overlays.</li>
                    <li>Pick the platforms you plan to export today.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
