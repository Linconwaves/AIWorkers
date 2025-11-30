'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Upload } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CloudUpload,
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

  const { data: uploads, isFetching } = useQuery({
    queryKey: ['uploads'],
    queryFn: () => apiClient.listUploads(),
  });

  const sortedUploads = useMemo(
    () => [...(uploads ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
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
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Please try again.' });
    },
  });

  const transformMutation = useMutation({
    mutationFn: (payload: Parameters<typeof apiClient.transformUpload>[0]) => apiClient.transformUpload(payload),
    onSuccess: (resp) => {
      setProcessingId(null);
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      setSelectedId(resp.upload.id);
      toast({ title: 'Edited version saved', description: 'Your edited asset is now in uploads.' });
      return resp;
    },
    onError: (err: unknown) => {
      setProcessingId(null);
      toast({ title: 'Could not transform image', description: err instanceof Error ? err.message : 'Please try again.' });
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
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Please try again.' });
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
      toast({ title: 'Rename failed', description: err instanceof Error ? err.message : 'Please try again.' });
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

  const runTransform = (mode: 'upscale' | 'downscale' | 'resize', extras?: { width?: number; height?: number; scaleFactor?: number }) => {
    if (!selectedUpload) {
      toast({ title: 'Select an upload', description: 'Choose an image from your assets first.' });
      return;
    }
    setProcessingId(selectedUpload.id);
    transformMutation.mutate({
      uploadId: selectedUpload.id,
      mode,
      ...extras,
    });
  };

  const handleDownload = () => {
    if (!selectedUpload) return;
    const link = document.createElement('a');
    link.href = selectedUpload.url;
    link.download = 'storecanvas-asset';
    link.click();
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

  return (
    <AppShell fullscreen>
      <div className="h-screen bg-background flex">
        {/* Sidebar: Assets */}
        <aside className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">My assets</p>
              <p className="text-sm text-foreground">Uploads & edits</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            </Button>
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
              {isFetching && <p className="text-sm text-muted-foreground">Loading uploads...</p>}
              {!isFetching && sortedUploads.length === 0 && (
                <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                  No uploads yet. Add an image to start editing.
                </div>
              )}
              {sortedUploads.map((upload) => {
                const active = selectedId === upload.id;
                return (
                  <button
                    key={upload.id}
                    onClick={() => setSelectedId(upload.id)}
                    className={`w-full text-left rounded-lg border transition-all ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex gap-3 p-3 items-start">
                      <div className="h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img src={upload.url} alt="Upload thumb" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{upload.name || 'Asset'}</p>
                          {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {upload.width && upload.height ? `${upload.width}×${upload.height}` : 'Size unknown'}
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
        <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-primary text-sm font-medium">
                <Wand2 className="h-4 w-4" /> Editing
              </p>
              <h1 className="text-2xl font-bold">Full-screen workspace</h1>
              <p className="text-sm text-muted-foreground">
                Select an asset on the left, tweak presets on the right, and export instantly.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={!selectedUpload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!selectedUpload || deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[2fr_340px]">
            <div className="flex items-center justify-center bg-muted/30 border-r border-border relative">
              {processingId && transformMutation.isPending && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </Badge>
                </div>
              )}
              {selectedUpload ? (
                <div className="max-w-4xl max-h-[80vh] w-full p-6">
                  <div className="rounded-2xl overflow-hidden border bg-background shadow-lg">
                    <img
                      src={selectedUpload.url}
                      alt="Selected asset"
                      className="w-full h-[70vh] object-contain bg-black/50"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex-1">
                      <Input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Asset name"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRename}
                      disabled={!selectedUpload || renameMutation.isPending}
                    >
                      {renameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedUpload.width && selectedUpload.height
                      ? `${selectedUpload.width} x ${selectedUpload.height}`
                      : 'Dimensions unknown'}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground space-y-2">
                  <ImageIcon className="h-10 w-10 mx-auto" />
                  <p>Select or upload an image to start editing</p>
                </div>
              )}
            </div>

            <aside className="border-l border-border bg-card">
              <div className="p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Presets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || processingId === selectedId}
                      onClick={() => runTransform('upscale', { scaleFactor: 2 })}
                    >
                      {processingId === selectedId && transformMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ZoomIn className="h-4 w-4 mr-2" />}
                      Upscale 2x
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || processingId === selectedId}
                      onClick={() => runTransform('downscale', { scaleFactor: 0.5 })}
                    >
                      {processingId === selectedId && transformMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ZoomOut className="h-4 w-4 mr-2" />}
                      Downscale 0.5x
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || processingId === selectedId}
                      onClick={() => runTransform('upscale', { scaleFactor: 1.5 })}
                    >
                      <ZoomIn className="h-4 w-4 mr-2" />
                      Gentle 1.5x boost
                    </Button>
                    <div className="pt-2">
                      <Label className="text-xs text-muted-foreground">Store targets</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant="ghost"
                          className="justify-start"
                          disabled={!selectedUpload || processingId === selectedId}
                          onClick={() => runTransform('resize', { width: 1242, height: 2688 })}
                        >
                          iPhone 6.5&quot; (1242x2688)
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          disabled={!selectedUpload || processingId === selectedId}
                          onClick={() => runTransform('resize', { width: 1284, height: 2778 })}
                        >
                          iPhone 6.7&quot; (1284x2778)
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          disabled={!selectedUpload || processingId === selectedId}
                          onClick={() => runTransform('resize', { width: 1080, height: 1920 })}
                        >
                          Play Store phone (1080x1920)
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          disabled={!selectedUpload || processingId === selectedId}
                          onClick={() => runTransform('resize', { width: 1024, height: 500 })}
                        >
                          Play Store feature (1024x500)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MoveVertical className="h-4 w-4" />
                      Custom size
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Width (px)</Label>
                        <Input
                          value={customSize.width ?? ''}
                          inputMode="numeric"
                          onChange={(e) => setCustomSize((prev) => ({ ...prev, width: e.target.value }))}
                          placeholder={selectedUpload?.width ? String(selectedUpload.width) : 'e.g. 1242'}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Height (px)</Label>
                        <Input
                          value={customSize.height ?? ''}
                          inputMode="numeric"
                          onChange={(e) => setCustomSize((prev) => ({ ...prev, height: e.target.value }))}
                          placeholder={selectedUpload?.height ? String(selectedUpload.height) : 'e.g. 2688'}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!selectedUpload || processingId === selectedId}
                      onClick={() => runTransform('resize', { width, height })}
                    >
                      {processingId === selectedId && transformMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      Apply custom size
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Enter one or both dimensions. We clamp sizes to 12k px max to keep exports safe.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || processingId === selectedId}
                      onClick={() => {
                        setProcessingId(selectedUpload?.id ?? null);
                        apiClient.applyFilter({ uploadId: selectedUpload!.id, action: 'blur', value: 3 })
                          .then((resp) => {
                            queryClient.invalidateQueries({ queryKey: ['uploads'] });
                            setSelectedId(resp.upload.id);
                            setProcessingId(null);
                            toast({ title: 'Blur applied' });
                          })
                          .catch((err) => {
                            setProcessingId(null);
                            toast({ title: 'Blur failed', description: err instanceof Error ? err.message : 'Please try again.' });
                          });
                      }}
                    >
                      <Droplets className="h-4 w-4 mr-2" />
                      Soft blur
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || processingId === selectedId}
                      onClick={() => {
                        setProcessingId(selectedUpload?.id ?? null);
                        apiClient.applyFilter({ uploadId: selectedUpload!.id, action: 'brightness', value: 1.1 })
                          .then((resp) => {
                            queryClient.invalidateQueries({ queryKey: ['uploads'] });
                            setSelectedId(resp.upload.id);
                            setProcessingId(null);
                            toast({ title: 'Brightness boosted' });
                          })
                          .catch((err) => {
                            setProcessingId(null);
                            toast({ title: 'Adjustment failed', description: err instanceof Error ? err.message : 'Please try again.' });
                          });
                      }}
                    >
                      <SunMedium className="h-4 w-4 mr-2" />
                      Brighten
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedUpload || processingId === selectedId}
                      onClick={() => {
                        setProcessingId(selectedUpload?.id ?? null);
                        apiClient.applyFilter({ uploadId: selectedUpload!.id, action: 'remove_background' })
                          .then((resp) => {
                            queryClient.invalidateQueries({ queryKey: ['uploads'] });
                            setSelectedId(resp.upload.id);
                            setProcessingId(null);
                            toast({ title: 'Background removed' });
                          })
                          .catch((err) => {
                            setProcessingId(null);
                            toast({ title: 'Removal failed', description: err instanceof Error ? err.message : 'Please try again.' });
                          });
                      }}
                    >
                      <Eraser className="h-4 w-4 mr-2" />
                      Remove background
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
