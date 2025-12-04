'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CloudUpload,
  Home,
  Download,
  Loader2,
  MoveVertical,
  Sparkles,
  Trash2,
  Wand2,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  CheckCircle2,
  SunMedium,
  Droplets,
  Eraser,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type CustomSizeState = { width?: string; height?: string };

export default function EditingPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customSize, setCustomSize] = useState<CustomSizeState>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [storePreset, setStorePreset] = useState('iphone65');

// download dialog state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadName, setDownloadName] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [createMode, setCreateMode] = useState<'art' | 'power_editor' | 'characters' | 'logos' | 'stock' | 'backgrounds' | 'anime'>('art');
  const [createPrompt, setCreatePrompt] = useState('');
  const [portraitMode, setPortraitMode] = useState<'general' | 'corporate' | 'lunar_new_year' | 'avatar' | 'cosplay' | 'real_estate' | 'medical' | 'xmas' | 'profile_editor'>('general');
  const [enhanceMode, setEnhanceMode] = useState<'upscale' | 'remove_object' | 'remove_background' | 'restyle' | 'colorize' | 'restore' | 'face_enhance' | 'auto_crop' | 'color_palette'>('upscale');
  const [gameMode, setGameMode] = useState<'tools' | 'characters' | 'background' | 'copywriter' | 'logo' | 'dnd'>('tools');
  const onCreateChange = (v: string) =>
    setCreateMode(v as typeof createMode);
  const onPortraitChange = (v: string) =>
    setPortraitMode(v as typeof portraitMode);
  const onEnhanceChange = (v: string) =>
    setEnhanceMode(v as typeof enhanceMode);
  const onGameChange = (v: string) =>
    setGameMode(v as typeof gameMode);

  const { data: uploads, isFetching } = useQuery({
    queryKey: ['uploads'],
    queryFn: () => apiClient.listUploads(),
  });

  const sortedUploads = useMemo(
    () =>
      [...(uploads ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [uploads]
  );

  useEffect(() => {
    const initial = searchParams?.get('assetId');
    if (initial && sortedUploads.some((u) => u.id === initial)) {
      setSelectedId(initial);
      return;
    }
    if (!selectedId && sortedUploads.length > 0) {
      setSelectedId(sortedUploads[0].id);
    }
  }, [sortedUploads, selectedId, searchParams]);

  const selectedUpload = sortedUploads.find((u) => u.id === selectedId) || null;
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    setNameDraft(selectedUpload?.name ?? '');
  }, [selectedUpload?.id]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiClient.createUpload(file, 'image'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      toast({ title: 'Upload complete', description: 'Your image is ready for editing.' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });

  const transformMutation = useMutation({
    mutationFn: (payload: Parameters<typeof apiClient.transformUpload>[0]) =>
      apiClient.transformUpload(payload),
    onSuccess: (resp) => {
      setProcessingId(null);
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      setSelectedId(resp.upload.id);
      toast({
        title: 'Edited version saved',
        description: 'Your edited asset is now in uploads.',
      });
      return resp;
    },
    onError: (err: unknown) => {
      setProcessingId(null);
      toast({
        title: 'Could not transform image',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteUpload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      setSelectedId((prev) => {
        if (prev === selectedId) return sortedUploads.find((u) => u.id !== prev)?.id ?? null;
        return prev;
      });
      toast({ title: 'Deleted', description: 'The upload was removed.' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => apiClient.renameUpload(id, name),
    onSuccess: (_resp, vars) => {
      setNameDraft(vars.name);
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      toast({ title: 'Name updated' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Rename failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Only images are supported', description: 'Please choose a PNG or JPEG file.' });
      return;
    }
    uploadMutation.mutate(file);
  };

  const runTransform = (
    mode: 'upscale' | 'downscale' | 'resize',
    extras?: { width?: number; height?: number; scaleFactor?: number }
  ) => {
    if (!selectedUpload) {
      toast({
        title: 'Select an upload',
        description: 'Choose an image from your assets first.',
      });
      return;
    }
    setProcessingId(selectedUpload.id);
    transformMutation.mutate({
      uploadId: selectedUpload.id,
      mode,
      ...extras,
    });
  };

  const runAiCreate = (mode: typeof createMode, prompt?: string) => {
    setProcessingId('ai-create');
    apiClient
      .aiCreate({ mode, prompt })
      .then((resp) => {
        queryClient.invalidateQueries({ queryKey: ['uploads'] });
        setSelectedId(resp.upload.id);
        toast({ title: `Created ${mode}`, description: 'Saved to your assets.' });
      })
      .catch((err) => {
        toast({
          title: 'Generation failed',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      })
      .finally(() => setProcessingId(null));
  };

  const runAiPortrait = (mode: typeof portraitMode) => {
    setProcessingId('ai-portrait');
    apiClient
      .aiPortrait({ mode })
      .then((resp) => {
        queryClient.invalidateQueries({ queryKey: ['uploads'] });
        setSelectedId(resp.upload.id);
        toast({ title: `Portrait: ${mode.replace(/_/g, ' ')}` });
      })
      .catch((err) => {
        toast({
          title: 'Portrait failed',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      })
      .finally(() => setProcessingId(null));
  };

  const runAiEnhance = (action: typeof enhanceMode) => {
    if (!selectedUpload) {
      toast({ title: 'Select an upload', description: 'Choose an image from your assets first.' });
      return;
    }
    setProcessingId(selectedUpload.id);
    apiClient
      .aiEnhance({ action, uploadId: selectedUpload.id })
      .then((resp) => {
        queryClient.invalidateQueries({ queryKey: ['uploads'] });
        setSelectedId(resp.upload.id);
        toast({ title: `Enhanced: ${action.replace(/_/g, ' ')}` });
      })
      .catch((err) => {
        toast({
          title: 'Enhance failed',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      })
      .finally(() => setProcessingId(null));
  };

  const runAiGame = (mode: typeof gameMode) => {
    setProcessingId('ai-game');
    apiClient
      .aiGame({ mode, uploadId: selectedUpload?.id })
      .then((resp) => {
        queryClient.invalidateQueries({ queryKey: ['uploads'] });
        setSelectedId(resp.upload.id);
        toast({ title: `Game: ${mode}` });
      })
      .catch((err) => {
        toast({
          title: 'Game task failed',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      })
      .finally(() => setProcessingId(null));
  };

  const handleDelete = () => {
    if (!selectedUpload) return;
    deleteMutation.mutate(selectedUpload.id);
  };

  const handleRename = () => {
    if (!selectedUpload) return;
    const next = nameDraft.trim();
    if (!next) {
      toast({ title: 'Enter a name', description: 'Name cannot be empty.' });
      return;
    }
    renameMutation.mutate({ id: selectedUpload.id, name: next });
  };

  const widthVal = Number(customSize.width);
  const heightVal = Number(customSize.height);
  const width = Number.isFinite(widthVal) && widthVal > 0 ? widthVal : undefined;
  const height = Number.isFinite(heightVal) && heightVal > 0 ? heightVal : undefined;

  // New download handler that opens the dialog
  const handleDownload = () => {
    if (!selectedUpload) return;
    const extension =
      selectedUpload.format ||
      selectedUpload.mimeType?.split('/')[1] ||
      'png';

    setDownloadName(
      selectedUpload.name
        ? `${selectedUpload.name}.${extension}`
        : `asset.${extension}`
    );
    setDownloadModalOpen(true);
  };

  const triggerDownload = async () => {
    if (!selectedUpload) return;
    setDownloadLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const resp = await fetch(
        `${baseUrl}/uploads/${selectedUpload.id}/download?filename=${encodeURIComponent(
          downloadName || 'asset'
        )}`,
        { credentials: 'include' }
      );
      if (!resp.ok) throw new Error('Download failed');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName || 'asset';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloadModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Download failed', description: err?.message ?? 'Please try again.' });
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <AppShell fullscreen>
      <div className="h-screen flex overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background">
        {/* Sidebar: Assets */}
        <aside className="w-80 border-r border-border/60 bg-card/70 backdrop-blur flex flex-col min-h-0">
          <div className="p-4 border-b border-border/60 flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                My assets
              </p>
              <p className="text-sm font-medium text-foreground">Uploads & edits</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-normal px-2 py-0">
                {sortedUploads.length} item{sortedUploads.length === 1 ? '' : 's'}
              </Badge>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="h-4 w-4" />
                )}
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {isFetching && (
                <p className="text-xs text-muted-foreground px-1">Loading uploads...</p>
              )}
              {!isFetching && sortedUploads.length === 0 && (
                <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground bg-background/50">
                  No uploads yet. Add an image to start editing.
                </div>
              )}
              {sortedUploads.map((upload) => {
                const active = selectedId === upload.id;
                return (
                  <button
                    key={upload.id}
                    onClick={() => setSelectedId(upload.id)}
                    className={`group w-full text-left rounded-xl border bg-background/70 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? 'border-primary/70 ring-1 ring-primary/40'
                        : 'border-border/70 hover:border-primary/50 hover:bg-background'
                    }`}
                  >
                    <div className="flex gap-3 p-3 items-start">
                      <div className="h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={upload.url}
                          alt={upload.name || 'Upload thumbnail'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {upload.name || 'Untitled asset'}
                          </p>
                          {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {upload.width && upload.height
                            ? `${upload.width}×${upload.height}`
                            : 'Size unknown'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Main canvas */}
        <main className="flex-1 flex flex-col min-h-0">
          <header className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-background/80 backdrop-blur z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                <Wand2 className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Image editor</span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight mt-1">Full-screen workspace</h1>
              <p className="text-xs text-muted-foreground">
                Select an asset on the left, tweak presets on the right, and export instantly.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {selectedUpload && (
                <div className="text-xs text-muted-foreground text-right">
                  <p>
                    {selectedUpload.format
                      ? `Format: ${selectedUpload.format.toUpperCase()}`
                      : 'Format: N/A'}
                  </p>
                  <p>
                    {selectedUpload.width && selectedUpload.height
                      ? `${selectedUpload.width}×${selectedUpload.height}px`
                      : 'Dimensions unknown'}
                  </p>
                  <p>
                    Updated{' '}
                    {formatDistanceToNow(new Date(selectedUpload.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/dashboard';
                  }}
                >
                  <Home className="h-4 w-4 mr-1.5" />
                  Home
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={!selectedUpload}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={!selectedUpload || deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1.5" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 grid min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,2fr)_360px]">
            {/* Canvas area */}
            <div className="flex min-h-0 items-center justify-center bg-muted/30 border-r border-border/60 relative">
              {processingId && transformMutation.isPending && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="flex items-center gap-2 bg-background/80">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing…
                  </Badge>
                </div>
              )}

              {selectedUpload ? (
                <div className="max-w-4xl w-full px-6 py-4 space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-border/70 bg-black/80 shadow-2xl flex items-center justify-center">
                    <img
                      src={selectedUpload.url}
                      alt="Selected asset"
                      className="w-full max-h-[70vh] object-contain"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 flex items-center gap-3">
                      <Input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Asset name"
                        className="h-9"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRename}
                        disabled={!selectedUpload || renameMutation.isPending}
                      >
                        {renameMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        )}
                        Save
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground text-right space-y-0.5">
                      <p>
                        Format:{' '}
                        <span className="uppercase">
                          {selectedUpload.mimeType?.split('/')[1] ??
                            selectedUpload.format?.toUpperCase() ??
                            'unknown'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground space-y-3 px-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted border border-dashed border-border mb-1">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">No image selected</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Choose an upload from the left sidebar or add a new file to start editing.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <CloudUpload className="h-4 w-4 mr-1.5" />
                    )}
                    Upload image
                  </Button>
                </div>
              )}
            </div>

            {/* Tools sidebar */}
            <aside className="border-l border-border/60 bg-card/80 backdrop-blur flex flex-col min-h-0">
              <ScrollArea className="flex-1 p-4 space-y-4">
                <Card className="shadow-sm border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Create
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Generate fresh assets or portrait styles.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Create</Label>
                      <Input
                        placeholder="Describe what you want to generate"
                        value={createPrompt}
                        onChange={(e) => setCreatePrompt(e.target.value)}
                        className="h-9 text-xs"
                      />
                      <div className="flex gap-2">
                        <Select value={createMode} onValueChange={onCreateChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="art">Art Generator</SelectItem>
                            <SelectItem value="power_editor">Power Editor</SelectItem>
                            <SelectItem value="characters">AI Characters</SelectItem>
                            <SelectItem value="logos">AI Logos</SelectItem>
                            <SelectItem value="stock">AI Stock Photos</SelectItem>
                            <SelectItem value="backgrounds">AI Backgrounds</SelectItem>
                            <SelectItem value="anime">AI Anime</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="secondary"
                          disabled={!!processingId}
                          onClick={() => runAiCreate(createMode, createPrompt || undefined)}
                        >
                          Run
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!!processingId}
                          onClick={() => runAiCreate('art', 'Blank canvas for new idea')}
                        >
                          Blank
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Portrait</Label>
                      <div className="flex gap-2">
                        <Select value={portraitMode} onValueChange={onPortraitChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Headshot</SelectItem>
                            <SelectItem value="corporate">Corporate Headshot</SelectItem>
                            <SelectItem value="lunar_new_year">Lunar New Year Headshot</SelectItem>
                            <SelectItem value="avatar">Avatar</SelectItem>
                            <SelectItem value="cosplay">Cosplay Headshot</SelectItem>
                            <SelectItem value="real_estate">Real Estate Headshot</SelectItem>
                            <SelectItem value="medical">Medical Headshot</SelectItem>
                            <SelectItem value="xmas">Xmas Headshot</SelectItem>
                            <SelectItem value="profile_editor">Profile Picture Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="secondary"
                          disabled={!!processingId}
                          onClick={() => runAiPortrait(portraitMode)}
                        >
                          Run
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Presets
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Quick scale options tuned for common use cases.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || !!processingId}
                      onClick={() => runTransform('upscale', { scaleFactor: 2 })}
                    >
                      {processingId === selectedId && transformMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ZoomIn className="h-4 w-4 mr-2" />
                      )}
                      Upscale 2×
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || !!processingId}
                      onClick={() => runTransform('downscale', { scaleFactor: 0.5 })}
                    >
                      {processingId === selectedId && transformMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ZoomOut className="h-4 w-4 mr-2" />
                      )}
                      Downscale 0.5×
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || !!processingId}
                      onClick={() => runTransform('upscale', { scaleFactor: 1.5 })}
                    >
                      <ZoomIn className="h-4 w-4 mr-2" />
                      Gentle 1.5× boost
                    </Button>
                    <div className="pt-3 space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Store targets</Label>
                      <div className="flex gap-2">
                        <Select value={storePreset} onValueChange={setStorePreset}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="Choose a preset" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iphone65">
                              iPhone 6.5&quot; (1242×2688)
                            </SelectItem>
                            <SelectItem value="iphone67">
                              iPhone 6.7&quot; (1284×2778)
                            </SelectItem>
                            <SelectItem value="play_phone">
                              Play Store phone (1080×1920)
                            </SelectItem>
                            <SelectItem value="play_feature">
                              Play Store feature (1024×500)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="secondary"
                          className="h-9 px-3 text-xs whitespace-nowrap"
                          disabled={!selectedUpload || !!processingId}
                          onClick={() => {
                            const presetMap: Record<string, { width: number; height: number }> = {
                              iphone65: { width: 1242, height: 2688 },
                              iphone67: { width: 1284, height: 2778 },
                              play_phone: { width: 1080, height: 1920 },
                              play_feature: { width: 1024, height: 500 },
                            };
                            const chosen = presetMap[storePreset];
                            if (chosen) {
                              runTransform('resize', chosen);
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MoveVertical className="h-4 w-4" />
                      Custom size
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Enter one or both dimensions in pixels.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Width (px)</Label>
                        <Input
                          value={customSize.width ?? ''}
                          inputMode="numeric"
                          onChange={(e) =>
                            setCustomSize((prev) => ({ ...prev, width: e.target.value }))
                          }
                          placeholder={
                            selectedUpload?.width
                              ? String(selectedUpload.width)
                              : 'e.g. 1242'
                          }
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Height (px)</Label>
                        <Input
                          value={customSize.height ?? ''}
                          inputMode="numeric"
                          onChange={(e) =>
                            setCustomSize((prev) => ({ ...prev, height: e.target.value }))
                          }
                          placeholder={
                            selectedUpload?.height
                              ? String(selectedUpload.height)
                              : 'e.g. 2688'
                          }
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-9 text-sm"
                      disabled={!selectedUpload || !!processingId}
                      onClick={() => runTransform('resize', { width, height })}
                    >
                      {processingId === selectedId && transformMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Apply custom size
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Sizes are clamped to 12k px on the longest edge to keep exports safe.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Filters
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Simple adjustments for quick polish.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || !!processingId}
                      onClick={() => {
                        setProcessingId(selectedUpload?.id ?? null);
                        apiClient
                          .applyFilter({ uploadId: selectedUpload!.id, action: 'blur', value: 3 })
                          .then((resp) => {
                            queryClient.invalidateQueries({ queryKey: ['uploads'] });
                            setSelectedId(resp.upload.id);
                            setProcessingId(null);
                            toast({ title: 'Blur applied' });
                          })
                          .catch((err) => {
                            setProcessingId(null);
                            toast({
                              title: 'Blur failed',
                              description:
                                err instanceof Error ? err.message : 'Please try again.',
                            });
                          });
                      }}
                    >
                      <Droplets className="h-4 w-4 mr-2" />
                      Soft blur
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || !!processingId}
                      onClick={() => {
                        setProcessingId(selectedUpload?.id ?? null);
                        apiClient
                          .applyFilter({
                            uploadId: selectedUpload!.id,
                            action: 'brightness',
                            value: 1.1,
                          })
                          .then((resp) => {
                            queryClient.invalidateQueries({ queryKey: ['uploads'] });
                            setSelectedId(resp.upload.id);
                            setProcessingId(null);
                            toast({ title: 'Brightness boosted' });
                          })
                          .catch((err) => {
                            setProcessingId(null);
                            toast({
                              title: 'Adjustment failed',
                              description:
                                err instanceof Error ? err.message : 'Please try again.',
                            });
                          });
                      }}
                    >
                      <SunMedium className="h-4 w-4 mr-2" />
                      Brighten
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || !!processingId}
                      onClick={() => {
                        setProcessingId(selectedUpload?.id ?? null);
                        apiClient
                          .applyFilter({
                            uploadId: selectedUpload!.id,
                            action: 'remove_background',
                          })
                          .then((resp) => {
                            queryClient.invalidateQueries({ queryKey: ['uploads'] });
                            setSelectedId(resp.upload.id);
                            setProcessingId(null);
                            toast({ title: 'Background removed' });
                          })
                          .catch((err) => {
                            setProcessingId(null);
                            toast({
                              title: 'Removal failed',
                              description:
                                err instanceof Error ? err.message : 'Please try again.',
                            });
                          });
                      }}
                    >
                      <Eraser className="h-4 w-4 mr-2" />
                      Remove background
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Enhance
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Apply AI fixes on the selected upload.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={enhanceMode} onValueChange={onEnhanceChange}>
                        <SelectTrigger className="w-full h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upscale">Photo Upscaler</SelectItem>
                          <SelectItem value="remove_object">Object Remover</SelectItem>
                          <SelectItem value="remove_background">Background Remover</SelectItem>
                          <SelectItem value="restyle">Photo Restyler</SelectItem>
                          <SelectItem value="colorize">Photo Colorizer</SelectItem>
                          <SelectItem value="restore">Photo Restorer</SelectItem>
                          <SelectItem value="face_enhance">Face Enhancer</SelectItem>
                          <SelectItem value="auto_crop">Auto Crop</SelectItem>
                          <SelectItem value="color_palette">Color Generator</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="secondary"
                        className="h-9 px-3 text-xs whitespace-nowrap"
                        disabled={!selectedUpload || !!processingId}
                        onClick={() => runAiEnhance(enhanceMode)}
                      >
                        Run
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Requires a selected upload.</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Game
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Generate game-ready assets or copy. Uses selected upload if provided.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={gameMode} onValueChange={onGameChange}>
                        <SelectTrigger className="w-full h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tools">AI Game Tools</SelectItem>
                          <SelectItem value="characters">AI Game Characters</SelectItem>
                          <SelectItem value="background">AI Game Background</SelectItem>
                          <SelectItem value="copywriter">AI Game Copywriter</SelectItem>
                          <SelectItem value="logo">AI Game Logo</SelectItem>
                          <SelectItem value="dnd">AI DnD Generator</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="secondary"
                        className="h-9 px-3 text-xs whitespace-nowrap"
                        disabled={!!processingId}
                        onClick={() => runAiGame(gameMode)}
                      >
                        Run
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-2 shadow-sm border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Convert format
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      We create a new upload in the chosen format.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(['png', 'jpeg', 'webp', 'avif'] as const).map((fmt) => {
                      const currentFormat =
                        selectedUpload?.format ||
                        selectedUpload?.mimeType?.split('/')[1]?.toLowerCase();
                      const isCurrent = currentFormat === fmt;
                      return (
                        <Button
                          key={fmt}
                          variant="outline"
                          className="w-full justify-start text-sm"
                          disabled={!selectedUpload || !!processingId || isCurrent}
                          onClick={() => {
                            setProcessingId(selectedUpload?.id ?? null);
                            apiClient
                              .convertUpload({ uploadId: selectedUpload!.id, format: fmt })
                              .then((resp) => {
                                queryClient.invalidateQueries({ queryKey: ['uploads'] });
                                setSelectedId(resp.upload.id);
                                setProcessingId(null);
                                toast({ title: `Converted to ${fmt.toUpperCase()}` });
                              })
                              .catch((err) => {
                                setProcessingId(null);
                                toast({
                                  title: 'Conversion failed',
                                  description:
                                    err instanceof Error ? err.message : 'Please try again.',
                                });
                              });
                          }}
                        >
                          Convert to {fmt.toUpperCase()}
                          {isCurrent && (
                            <span className="ml-2 text-[11px] text-muted-foreground">
                              (current)
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              </ScrollArea>
            </aside>
          </div>
        </main>
      </div>

      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export download</DialogTitle>
            <DialogDescription>Set a filename for your download.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Export name</Label>
            <Input
              value={downloadName}
              onChange={(e) => setDownloadName(e.target.value)}
              placeholder="asset.png"
            />
          </div>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDownloadModalOpen(false)}
              disabled={downloadLoading}
            >
              Cancel
            </Button>
            <Button onClick={triggerDownload} disabled={downloadLoading || !downloadName}>
              {downloadLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
