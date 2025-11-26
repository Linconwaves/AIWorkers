'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Palette, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';

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
      const step = 24;
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

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const queryClient = useQueryClient();
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', params.projectId],
    queryFn: () => apiClient.getProject(params.projectId),
  });

  const { data: designs, isLoading: designsLoading } = useQuery({
    queryKey: ['designs', params.projectId],
    queryFn: () => apiClient.listProjectDesigns(params.projectId),
  });
  const [form, setForm] = useState({
    name: '',
    primaryColor: '',
    secondaryColor: '',
    logoUrl: '',
    fontFamily: 'Inter',
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () =>
      apiClient.updateProject(params.projectId, {
        name: form.name,
        brandKit: {
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          logoUrl: form.logoUrl,
          fontFamily: form.fontFamily,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', params.projectId] });
    },
  });

  // populate form once project loads
  useEffect(() => {
    if (!project) return;
    setForm({
      name: project.name ?? '',
      primaryColor: project.brandKit?.primaryColor || '#6366f1',
      secondaryColor: project.brandKit?.secondaryColor || '#a855f7',
      logoUrl: project.brandKit?.logoUrl || '',
      fontFamily: project.brandKit?.fontFamily || 'Inter',
    });
  }, [project]);

  if (projectLoading) {
    return (
      <AppShell>
        <div className="p-8 text-center">Loading project...</div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="p-8 text-center">Project not found</div>
      </AppShell>
    );
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const upload = await apiClient.createUpload(file, 'logo');
      const colors = await extractPalette(upload.url);
      setForm((prev) => ({
        ...prev,
        logoUrl: upload.url,
        primaryColor: colors?.[0] ?? prev.primaryColor,
        secondaryColor: colors?.[1] ?? prev.secondaryColor,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!form.logoUrl) return;
    setForm((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold font-['Libertinus_Sans_Regular']">{project.name}</h1>
            <p className="text-muted-foreground mt-1">
              Created {format(new Date(project.createdAt), 'MMMM d, yyyy')}
            </p>
            <div className="flex gap-2 mt-2">
              {project.platforms?.map((platform) => (
                <span key={platform} className="text-xs px-2 py-1 rounded-full bg-secondary">
                  {platform}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Edit Brand Kit
            </Button>
            <Link href={`/projects/${params.projectId}/designs/new`}>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                New Design
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Brand Kit</CardTitle>
            <CardDescription>Your brand colors and assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-lg border border-border"
                    style={{ backgroundColor: project.brandKit?.primaryColor }}
                  />
                  <span className="text-sm font-mono">{project.brandKit?.primaryColor}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-lg border border-border"
                    style={{ backgroundColor: project.brandKit?.secondaryColor }}
                  />
                  <span className="text-sm font-mono">{project.brandKit?.secondaryColor}</span>
                </div>
              </div>

              {project.brandKit?.logoUrl && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Logo</Label>
                  <div className="w-16 h-16 relative rounded-lg border border-border bg-secondary/50">
                    <Image
                      src={project.brandKit.logoUrl}
                      alt="Logo"
                      fill
                      sizes="64px"
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Designs</h2>
          {designsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading designs...</div>
          ) : designs && designs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <Link key={design.id} href={`/designs/${design.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Palette className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary capitalize">
                          {design.type.replace('_', ' ')}
                        </span>
                      </div>
                      <CardTitle className="mt-4">{design.name}</CardTitle>
                      <CardDescription>
                        {design.baseWidth} × {design.baseHeight}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        {design.presets?.length || 0} export presets
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No designs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first design for this project
                </p>
                <Link href={`/projects/${params.projectId}/designs/new`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Design
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit brand kit</DialogTitle>
            <DialogDescription>Update name, colors, logo, and font.</DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10"
                    disabled={updateMutation.isPending}
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-16 h-10"
                    disabled={updateMutation.isPending}
                  />
                  <Input
                    value={form.secondaryColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={updateMutation.isPending || uploading}
                  className="w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : form.logoUrl ? 'Replace logo' : 'Upload logo'}
                </Button>
                {form.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemoveLogo}
                    disabled={updateMutation.isPending || uploading}
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
              {form.logoUrl && (
                <div className="mt-2 inline-flex items-center gap-3 rounded-md border p-2 bg-muted/50">
                  <div className="relative h-12 w-12 rounded overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-sm text-muted-foreground">Logo linked</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font family</Label>
              <Select
                value={form.fontFamily}
                onValueChange={(val) => setForm((prev) => ({ ...prev, fontFamily: val }))}
                disabled={updateMutation.isPending}
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
