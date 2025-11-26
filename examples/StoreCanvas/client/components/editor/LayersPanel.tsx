'use client';

import { Layer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export function LayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onMoveLayer,
}: LayersPanelProps) {
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const getLayerLabel = (layer: Layer): string => {
    if (layer.type === 'background') return 'Background';
    if (layer.type === 'text') return (layer.data as any).content?.slice(0, 20) || 'Text';
    return layer.type.charAt(0).toUpperCase() + layer.type.slice(1);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Layers</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedLayers.map((layer) => (
            <div
              key={layer.id}
              className={`p-2 rounded-md flex items-center gap-2 cursor-pointer transition-colors ${
                selectedLayerId === layer.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
              >
                {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              <span className="flex-1 text-sm truncate">{getLayerLabel(layer)}</span>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayer(layer.id, 'up');
                  }}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayer(layer.id, 'down');
                  }}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {layers.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No layers yet. Add elements to get started.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
