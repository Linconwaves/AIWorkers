'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text, Circle } from 'react-konva';
import { Layer as LayerType } from '@/lib/types';
import Konva from 'konva';

interface CanvasEditorProps {
  width: number;
  height: number;
  layers: LayerType[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, data: any) => void;
}

export function CanvasEditor({
  width,
  height,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
}: CanvasEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    layers.forEach((layer) => {
      const imageData = layer.data as any;
      const shouldLoad =
        layer.type === 'image' ||
        layer.type === 'logo' ||
        (layer.type === 'background' && imageData?.type === 'image');
      if (shouldLoad && imageData?.url && !images[imageData.url]) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = imageData.url;
        img.onload = () => {
          setImages((prev) => ({ ...prev, [imageData.url]: img }));
        };
      }
    });
  }, [layers, images]);

  const containerWidth = 1200;
  const containerHeight = 800;
  const scale = Math.min(containerWidth / width, containerHeight / height, 1);

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex items-center justify-center bg-secondary/30 rounded-lg border border-border overflow-auto">
      <div style={{ width: width * scale, height: height * scale }}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={scale}
          scaleY={scale}
          onClick={(e) => {
            if (e.target === e.target.getStage()) {
              onSelectLayer(null);
            }
          }}
        >
          <Layer>
            {sortedLayers.map((layer) => {
              if (!layer.visible) return null;

              if (layer.type === 'background') {
                const bgData = (layer.data as any) || {};
                const kind = bgData?.type;
                if (kind === 'solid') {
                  return (
                    <Rect
                      key={layer.id}
                      x={0}
                      y={0}
                      width={width}
                      height={height}
                      fill={bgData.color || '#000'}
                    />
                  );
                } else if (kind === 'gradient' && bgData.gradient) {
                  const colors = Array.isArray(bgData.gradient.colors) ? bgData.gradient.colors : [];
                  const stops = Array.isArray(bgData.gradient.stops) ? bgData.gradient.stops : [];
                  return (
                    <Rect
                      key={layer.id}
                      x={0}
                      y={0}
                      width={width}
                      height={height}
                      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                      fillLinearGradientEndPoint={{
                        x: width * Math.cos(((bgData.gradient.angle || 0) * Math.PI) / 180),
                        y: height * Math.sin(((bgData.gradient.angle || 0) * Math.PI) / 180),
                      }}
                      fillLinearGradientColorStops={colors.flatMap((color: string, i: number) => [
                        stops[i] ?? (colors.length > 1 ? i / (colors.length - 1) : 0),
                        color,
                      ])}
                    />
                  );
                } else if (kind === 'image' && bgData.url && images[bgData.url]) {
                  return (
                    <KonvaImage
                      key={layer.id}
                      image={images[bgData.url]}
                      x={0}
                      y={0}
                      width={width}
                      height={height}
                      opacity={bgData.opacity ?? 1}
                    />
                  );
                } else {
                  // Fallback solid background if data is missing or malformed
                  return (
                    <Rect key={layer.id} x={0} y={0} width={width} height={height} fill="#000" />
                  );
                }
              }

              if (layer.type === 'shape') {
                const shapeData = layer.data as any;
                if (shapeData.shape === 'rectangle' || shapeData.shape === 'rounded-rect') {
                  return (
                    <Rect
                      key={layer.id}
                      x={shapeData.x}
                      y={shapeData.y}
                      width={shapeData.width}
                      height={shapeData.height}
                      rotation={shapeData.rotation}
                      fill={shapeData.fillColor}
                      opacity={shapeData.opacity}
                      cornerRadius={shapeData.borderRadius || 0}
                      draggable={selectedLayerId === layer.id}
                      stroke={selectedLayerId === layer.id ? '#3b82f6' : undefined}
                      strokeWidth={selectedLayerId === layer.id ? 2 : 0}
                      onClick={() => onSelectLayer(layer.id)}
                      onDragEnd={(e) => {
                        onUpdateLayer(layer.id, {
                          ...shapeData,
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        onUpdateLayer(layer.id, {
                          ...shapeData,
                          x: node.x(),
                          y: node.y(),
                          width: node.width() * node.scaleX(),
                          height: node.height() * node.scaleY(),
                          rotation: node.rotation(),
                        });
                        node.scaleX(1);
                        node.scaleY(1);
                      }}
                    />
                  );
                } else if (shapeData.shape === 'circle') {
                  return (
                    <Circle
                      key={layer.id}
                      x={shapeData.x + shapeData.width / 2}
                      y={shapeData.y + shapeData.height / 2}
                      radius={shapeData.width / 2}
                      fill={shapeData.fillColor}
                      opacity={shapeData.opacity}
                      draggable={selectedLayerId === layer.id}
                      stroke={selectedLayerId === layer.id ? '#3b82f6' : undefined}
                      strokeWidth={selectedLayerId === layer.id ? 2 : 0}
                      onClick={() => onSelectLayer(layer.id)}
                      onDragEnd={(e) => {
                        onUpdateLayer(layer.id, {
                          ...shapeData,
                          x: e.target.x() - shapeData.width / 2,
                          y: e.target.y() - shapeData.height / 2,
                        });
                      }}
                    />
                  );
                }
              }

              if ((layer.type === 'image' || layer.type === 'logo') && images[(layer.data as any).url]) {
                const imgData = layer.data as any;
                return (
                  <KonvaImage
                    key={layer.id}
                    image={images[imgData.url]}
                    x={imgData.x}
                    y={imgData.y}
                    width={imgData.width}
                    height={imgData.height}
                    rotation={imgData.rotation}
                    opacity={imgData.opacity}
                    draggable={selectedLayerId === layer.id}
                    stroke={selectedLayerId === layer.id ? '#3b82f6' : undefined}
                    strokeWidth={selectedLayerId === layer.id ? 2 : 0}
                    onClick={() => onSelectLayer(layer.id)}
                    onDragEnd={(e) => {
                      onUpdateLayer(layer.id, {
                        ...imgData,
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      onUpdateLayer(layer.id, {
                        ...imgData,
                        x: node.x(),
                        y: node.y(),
                        width: node.width() * node.scaleX(),
                        height: node.height() * node.scaleY(),
                        rotation: node.rotation(),
                      });
                      node.scaleX(1);
                      node.scaleY(1);
                    }}
                  />
                );
              }

              if (layer.type === 'text') {
                const textData = layer.data as any;
                return (
                  <Text
                    key={layer.id}
                    x={textData.x}
                    y={textData.y}
                    text={textData.content}
                    fontSize={textData.fontSize}
                    fontFamily={textData.fontFamily}
                    fontStyle={textData.fontWeight >= 600 ? 'bold' : 'normal'}
                    fill={textData.color}
                    rotation={textData.rotation}
                    width={textData.width}
                    align={textData.align}
                    letterSpacing={textData.letterSpacing}
                    lineHeight={textData.lineHeight}
                    draggable={selectedLayerId === layer.id}
                    stroke={selectedLayerId === layer.id ? '#3b82f6' : undefined}
                    strokeWidth={selectedLayerId === layer.id ? 0.5 : 0}
                    onClick={() => onSelectLayer(layer.id)}
                    onDragEnd={(e) => {
                      onUpdateLayer(layer.id, {
                        ...textData,
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                  />
                );
              }

              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
