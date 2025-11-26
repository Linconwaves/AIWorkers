'use client';

import { Layer } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PropertiesPanelProps {
  layer: Layer | null;
  onUpdateLayer: (data: any) => void;
}

export function PropertiesPanel({ layer, onUpdateLayer }: PropertiesPanelProps) {
  if (!layer) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a layer to edit its properties
        </p>
      </div>
    );
  }

  const data = (layer.data as any) ?? {};

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Properties</h3>
        </div>

        {layer.type === 'text' && (
          <>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={data.content || ''}
                onChange={(e) => onUpdateLayer({ ...data, content: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="number"
                value={data.fontSize || 16}
                onChange={(e) => onUpdateLayer({ ...data, fontSize: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={String(data.fontWeight || 400)}
                onValueChange={(value) => onUpdateLayer({ ...data, fontWeight: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light</SelectItem>
                  <SelectItem value="400">Regular</SelectItem>
                  <SelectItem value="600">Semibold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={data.color || '#ffffff'}
                  onChange={(e) => onUpdateLayer({ ...data, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={data.color || '#ffffff'}
                  onChange={(e) => onUpdateLayer({ ...data, color: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={data.align || 'left'}
                onValueChange={(value) => onUpdateLayer({ ...data, align: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Line Height</Label>
              <Input
                type="number"
                step="0.1"
                value={data.lineHeight || 1.2}
                onChange={(e) => onUpdateLayer({ ...data, lineHeight: parseFloat(e.target.value) })}
              />
            </div>
          </>
        )}

        {(layer.type === 'image' || layer.type === 'logo') && (
          <>
            <div className="space-y-2">
              <Label>Opacity</Label>
              <Slider
                value={[data.opacity * 100 || 100]}
                onValueChange={([value]) => onUpdateLayer({ ...data, opacity: value / 100 })}
                max={100}
                step={1}
              />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(data.opacity * 100 || 100)}%
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rotation</Label>
              <Input
                type="number"
                value={Math.round(data.rotation || 0)}
                onChange={(e) => onUpdateLayer({ ...data, rotation: parseInt(e.target.value) })}
              />
            </div>
          </>
        )}

        {layer.type === 'shape' && (
          <>
            <div className="space-y-2">
              <Label>Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={data.fillColor || '#000000'}
                  onChange={(e) => onUpdateLayer({ ...data, fillColor: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={data.fillColor || '#000000'}
                  onChange={(e) => onUpdateLayer({ ...data, fillColor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opacity</Label>
              <Slider
                value={[data.opacity * 100 || 100]}
                onValueChange={([value]) => onUpdateLayer({ ...data, opacity: value / 100 })}
                max={100}
                step={1}
              />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(data.opacity * 100 || 100)}%
              </div>
            </div>

            {(data.shape === 'rectangle' || data.shape === 'rounded-rect') && (
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Input
                  type="number"
                  value={data.borderRadius || 0}
                  onChange={(e) => onUpdateLayer({ ...data, borderRadius: parseInt(e.target.value) })}
                />
              </div>
            )}
          </>
        )}

        {layer.type === 'background' && data && (
          <>
            {data.type === 'gradient' && data.gradient && (
              <>
                <div className="space-y-2">
                  <Label>Gradient Angle</Label>
                  <Slider
                    value={[data.gradient.angle || 0]}
                    onValueChange={([value]) =>
                      onUpdateLayer({
                        ...data,
                        gradient: { ...data.gradient, angle: value },
                      })
                    }
                    max={360}
                    step={1}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {data.gradient.angle || 0}°
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Colors</Label>
                  {data.gradient.colors.map((color: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...data.gradient.colors];
                          newColors[index] = e.target.value;
                          onUpdateLayer({
                            ...data,
                            gradient: { ...data.gradient, colors: newColors },
                          });
                        }}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...data.gradient.colors];
                          newColors[index] = e.target.value;
                          onUpdateLayer({
                            ...data,
                            gradient: { ...data.gradient, colors: newColors },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>X Position</Label>
            <Input
              type="number"
              value={Math.round(data.x || 0)}
              onChange={(e) => onUpdateLayer({ ...data, x: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Y Position</Label>
            <Input
              type="number"
              value={Math.round(data.y || 0)}
              onChange={(e) => onUpdateLayer({ ...data, y: parseInt(e.target.value) })}
            />
          </div>
        </div>

        {(layer.type === 'image' || layer.type === 'logo' || layer.type === 'shape') && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input
                type="number"
                value={Math.round(data.width || 0)}
                onChange={(e) => onUpdateLayer({ ...data, width: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                type="number"
                value={Math.round(data.height || 0)}
                onChange={(e) => onUpdateLayer({ ...data, height: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
