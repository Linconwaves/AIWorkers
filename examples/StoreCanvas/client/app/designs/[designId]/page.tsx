'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Layer } from '@/lib/types';
import { CanvasEditor } from '@/components/editor/CanvasEditor';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Download,
  Image as ImageIcon,
  Type,
  Square,
  Upload,
  Save,
  Maximize2,
  Minimize2,
  Sparkles,
  Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DesignEditorPage({ params }: { params: { designId: string } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [localLayers, setLocalLayers] = useState<Layer[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [panelsVisible, setPanelsVisible] = useState(false);
  const [bgPrompt, setBgPrompt] = useState('Vibrant gradient with soft lighting');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [bgDialogOpen, setBgDialogOpen] = useState(false);
  const [copyGoal, setCopyGoal] = useState('Short tagline under 40 characters for finance app');
  const [copySuggestions, setCopySuggestions] = useState<string[]>([]);
  const [img2imgPrompt, setImg2imgPrompt] = useState('Polish the UI and add soft glow');
  const [img2imgFile, setImg2imgFile] = useState<File | null>(null);

  const proxify = (url: string) => {
    if (!url) return url;
    if (url.startsWith('/uploads/proxy')) return url;
    if (url.startsWith('http')) return `/uploads/proxy?url=${encodeURIComponent(url)}`;
    return url;
  };

  const proxifyLayers = (layers: Layer[] = []): Layer[] =>
    layers.map((layer) => {
      if (layer.type === 'image' || layer.type === 'logo') {
        return { ...layer, data: { ...(layer.data as any), url: proxify((layer.data as any).url) } };
      }
      if (layer.type === 'background') {
        const data = layer.data as any;
        if (data?.type === 'image' && data.url) {
          return { ...layer, data: { ...data, url: proxify(data.url) }, source: proxify(data.url) };
        }
        if (layer.source) {
          return { ...layer, source: proxify(layer.source) };
        }
      }
      return layer;
    });

  const { data: design, isLoading } = useQuery({
    queryKey: ['design', params.designId],
    queryFn: () => apiClient.getDesign(params.designId),
  });

  useEffect(() => {
    if (design?.layers) {
      // Ensure remote images are proxied for CORS-safe canvas usage.
      setLocalLayers(proxifyLayers(design.layers as Layer[]));
    }
  }, [design]);

  const updateMutation = useMutation({
    mutationFn: (layers: Layer[]) => apiClient.updateDesign(params.designId, { layers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design', params.designId] });
      toast({ title: 'Design saved' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(localLayers);
  };

  const handleGenerateBackground = async () => {
    if (!bgPrompt.trim()) return;
    try {
      setIsGeneratingBg(true);
      const updated = await apiClient.generateBackground(params.designId, { prompt: bgPrompt });
      setLocalLayers(proxifyLayers(updated.layers as Layer[]));
      queryClient.invalidateQueries({ queryKey: ['design', params.designId] });
      toast({ title: 'Background generated' });
      setBgDialogOpen(false);
    } catch (error) {
      toast({ title: 'Background generation failed', variant: 'destructive' });
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const handleSuggestCopy = async () => {
    if (!copyGoal.trim()) return;
    try {
      const { options } = await apiClient.suggestCopy(params.designId, { goal: copyGoal });
      setCopySuggestions(options);
      toast({ title: 'Copy suggestions ready' });
    } catch (error) {
      toast({ title: 'Copy suggestion failed', variant: 'destructive' });
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleApplyImg2Img = async () => {
    if (!img2imgPrompt.trim() || !img2imgFile) return;
    try {
      const base64 = await fileToBase64(img2imgFile);
      const updated = await apiClient.applyImg2Img(params.designId, {
        prompt: img2imgPrompt,
        base64Image: base64
      });
      setLocalLayers(proxifyLayers(updated.layers as Layer[]));
      queryClient.invalidateQueries({ queryKey: ['design', params.designId] });
      toast({ title: 'Image enhanced' });
    } catch (error) {
      toast({ title: 'Img2Img failed', variant: 'destructive' });
    }
  };

  const handleAddText = () => {
    const newLayer: Layer = {
      id: `text-${Date.now()}`,
      type: 'text',
      zIndex: localLayers.length,
      visible: true,
      locked: false,
      data: {
        content: 'New Text',
        x: 100,
        y: 100,
        rotation: 0,
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 600,
        color: '#ffffff',
        letterSpacing: 0,
        lineHeight: 1.2,
        align: 'left',
      },
    };
    setLocalLayers([...localLayers, newLayer]);
  };

  const handleAddShape = () => {
    const newLayer: Layer = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      zIndex: localLayers.length,
      visible: true,
      locked: false,
      data: {
        shape: 'rounded-rect',
        x: 150,
        y: 150,
        width: 300,
        height: 200,
        rotation: 0,
        fillColor: '#3b82f6',
        borderRadius: 16,
        opacity: 0.9,
      },
    };
    setLocalLayers([...localLayers, newLayer]);
  };

  const handleAddImage = async (file: File) => {
    try {
      const upload = await apiClient.createUpload(file, 'image');
      const img = new Image();
      const proxied = proxify(upload.url);
      img.src = proxied;
      img.onload = () => {
        const newLayer: Layer = {
          id: `image-${Date.now()}`,
          type: 'image',
          zIndex: localLayers.length,
          visible: true,
          locked: false,
          data: {
            url: proxied,
            x: 100,
            y: 100,
            width: img.width,
            height: img.height,
            rotation: 0,
            opacity: 1,
          },
        };
        setLocalLayers([...localLayers, newLayer]);
      };
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const handleUpdateLayer = (id: string, data: any) => {
    setLocalLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, data } : layer))
    );
  };

  const handleToggleVisibility = (id: string) => {
    setLocalLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleDeleteLayer = (id: string) => {
    setLocalLayers((prev) => prev.filter((layer) => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const index = localLayers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const newLayers = [...localLayers];
    const targetLayer = newLayers[index];

    if (direction === 'up' && targetLayer.zIndex < localLayers.length - 1) {
      const swapLayer = newLayers.find((l) => l.zIndex === targetLayer.zIndex + 1);
      if (swapLayer) {
        swapLayer.zIndex = targetLayer.zIndex;
        targetLayer.zIndex += 1;
      }
    } else if (direction === 'down' && targetLayer.zIndex > 0) {
      const swapLayer = newLayers.find((l) => l.zIndex === targetLayer.zIndex - 1);
      if (swapLayer) {
        swapLayer.zIndex = targetLayer.zIndex;
        targetLayer.zIndex -= 1;
      }
    }

    setLocalLayers(newLayers);
  };

  const selectedLayer = localLayers.find((l) => l.id === selectedLayerId) || null;

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 text-center">Loading design...</div>
      </AppShell>
    );
  }

  if (!design) {
    return (
      <AppShell>
        <div className="p-8 text-center">Design not found</div>
      </AppShell>
    );
  }

  return (
    <AppShell fullscreen={isFullscreen}>
      <div className="h-screen flex flex-col">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-card">
          <div>
            <h1 className="text-lg font-semibold">{design.name}</h1>
            <p className="text-xs text-muted-foreground">
              {design.baseWidth} × {design.baseHeight}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsFullscreen((prev) => !prev)}
              variant="ghost"
              size="icon"
              title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Dialog open={bgDialogOpen} onOpenChange={(open) => setBgDialogOpen(open)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Background
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Background</DialogTitle>
                  <DialogDescription>Describe the mood or style you want.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label htmlFor="bg-prompt">Prompt</Label>
                  <Input
                    id="bg-prompt"
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    placeholder="Vibrant gradient with soft lighting"
                    disabled={isGeneratingBg}
                  />
                  <Button onClick={handleGenerateBackground} disabled={!bgPrompt.trim() || isGeneratingBg}>
                    {isGeneratingBg ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Copy Ideas
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Suggest Copy</DialogTitle>
                  <DialogDescription>Give a short goal or character limit.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label htmlFor="copy-goal">Goal</Label>
                  <Input
                    id="copy-goal"
                    value={copyGoal}
                    onChange={(e) => setCopyGoal(e.target.value)}
                    placeholder="Short tagline under 40 characters"
                  />
                  <Button onClick={handleSuggestCopy} disabled={!copyGoal.trim()}>
                    Suggest
                  </Button>
                  {copySuggestions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Suggestions</Label>
                      <ul className="text-sm space-y-1">
                        {copySuggestions.map((s) => (
                          <li key={s} className="rounded border border-border px-2 py-1">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Img2Img Enhance</DialogTitle>
                  <DialogDescription>Upload an image and describe the enhancement.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label htmlFor="img2img-prompt">Prompt</Label>
                  <Input
                    id="img2img-prompt"
                    value={img2imgPrompt}
                    onChange={(e) => setImg2imgPrompt(e.target.value)}
                    placeholder="Polish the UI and add soft glow"
                  />
                  <Label>Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImg2imgFile(e.target.files?.[0] ?? null)}
                  />
                  <Button onClick={handleApplyImg2Img} disabled={!img2imgPrompt.trim() || !img2imgFile}>
                    Enhance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

              <Button onClick={handleAddText} variant="outline" size="sm">
                <Type className="w-4 h-4 mr-2" />
                Text
              </Button>

            <Button onClick={handleAddShape} variant="outline" size="sm">
              <Square className="w-4 h-4 mr-2" />
              Shape
            </Button>

            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddImage(file);
                }}
              />
            </label>

            <Button onClick={handleSave} variant="default" size="sm" disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>

            <Button
              onClick={() => router.push(`/designs/${params.designId}/exports`)}
              variant="default"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

          <div className="flex-1 flex overflow-hidden">
          <div
            className={clsx(
              'border-r border-border bg-card transition-all duration-200',
              panelsVisible ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
            )}
          >
            <LayersPanel
              layers={localLayers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={(id) => {
                setSelectedLayerId(id);
                setPanelsVisible(true);
              }}
              onToggleVisibility={handleToggleVisibility}
              onDeleteLayer={handleDeleteLayer}
              onMoveLayer={handleMoveLayer}
            />
          </div>

          <div className="flex-1 p-4 overflow-auto bg-background">
            <CanvasEditor
              width={design.baseWidth}
              height={design.baseHeight}
              layers={localLayers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={(id) => {
                setSelectedLayerId(id);
                setPanelsVisible(true);
              }}
              onUpdateLayer={handleUpdateLayer}
            />
          </div>

          <div
            className={clsx(
              'border-l border-border bg-card transition-all duration-200',
              panelsVisible ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
            )}
          >
            <PropertiesPanel
              layer={selectedLayer}
              onUpdateLayer={(data) => {
                if (selectedLayerId) {
                  handleUpdateLayer(selectedLayerId, data);
                }
              }}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
